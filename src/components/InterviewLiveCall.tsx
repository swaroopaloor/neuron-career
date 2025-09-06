import { useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mic, MicOff, Volume2, VolumeX, ChevronRight, Sparkles, Clipboard, X, User } from "lucide-react";
import { toast } from "sonner";

type InterviewType = "Intro" | "Technical" | "HR";

function computeMetrics(transcript: string, startedAt: number | null) {
  const text = (transcript || "").toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const durationMin = startedAt ? Math.max((Date.now() - startedAt) / 60000, 0.01) : 0.01;
  const wpm = Math.round(words.length / durationMin);
  const fillers = ["um","uh","like","you know","so","actually","basically","kind of","sort of","i guess","well","right","okay"];
  let fillerCount = 0;
  for (const f of fillers) {
    const re = new RegExp(`\\b${f.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "g");
    fillerCount += (text.match(re) || []).length;
  }
  const fillerPerMin = Math.round(fillerCount / durationMin);
  let confidence = 100;
  confidence -= Math.min(fillerPerMin * 2, 40);
  const pacePenalty = wpm < 90 ? (90 - wpm) * 0.3 : wpm > 170 ? (wpm - 170) * 0.3 : 0;
  confidence -= Math.min(Math.max(pacePenalty, 0), 35);
  confidence = Math.max(5, Math.min(100, Math.round(confidence)));
  return { wpm, fillerCount, fillerPerMin, confidence };
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border px-3 py-2 bg-background/60">
      <div className={`text-lg font-bold ${accent ?? ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default function InterviewLiveCall({
  open,
  onClose,
  jd,
  resumeFileId,
  defaultType = "Intro",
  defaultDuration = 30,
}: {
  open: boolean;
  onClose: () => void;
  jd?: string;
  resumeFileId?: string;
  defaultType?: InterviewType;
  defaultDuration?: number; // minutes
}) {
  const [interviewType, setInterviewType] = useState<InterviewType>(defaultType);
  const [durationMin, setDurationMin] = useState<number>(defaultDuration);
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);

  const [question, setQuestion] = useState<string>("Tell me about yourself.");
  const [transcript, setTranscript] = useState<string>("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [qIndex, setQIndex] = useState<number>(0);
  const [questionsAsked, setQuestionsAsked] = useState<number>(0);
  const [targetQuestions, setTargetQuestions] = useState<number>(0);

  const [metricsLog, setMetricsLog] = useState<Array<{ wpm: number; fillerPerMin: number; confidence: number }>>([]);
  const [sessionTranscript, setSessionTranscript] = useState<string>("");
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");
  const [feedbackLoading, setFeedbackLoading] = useState<boolean>(false);

  const [chat, setChat] = useState<Array<{ role: "ai" | "user"; text: string; ts: number }>>([]);
  const [liveUserUtterance, setLiveUserUtterance] = useState<string>("");

  const [micLevel, setMicLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelRAFRef = useRef<number | null>(null);

  const genQs = useAction(api.aiInterview.generateQuestions);
  const followUp = useAction(api.aiInterview.nextFollowUp);
  const sessionFeedback = useAction(api.aiInterview.sessionFeedback);
  const transcribeChunk = useAction(api.aiInterview.transcribeChunk);

  // Groq STT recorder refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const sendingRef = useRef<boolean>(false);
  const stoppedRef = useRef<boolean>(true);

  // derive target questions from duration
  const deriveTargetQuestions = (mins: number) => {
    if (mins <= 30) return 10;
    if (mins <= 60) return 18;
    return 25;
  };

  // TTS
  const ttsUtterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speak = (text: string) => {
    try {
      if (muted) return;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1;
        u.pitch = 1;
        u.volume = muted ? 0 : 1;
        ttsUtterRef.current = u;
        window.speechSynthesis.speak(u);
      }
    } catch {
      // ignore
    }
  };
  const stopSpeak = () => {
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      ttsUtterRef.current = null;
    } catch {}
  };

  // Helper: push AI bubble
  const pushAi = (text: string) => {
    setChat((c) => [...c, { role: "ai", text, ts: Date.now() }]);
  };
  // Helper: push User bubble
  const pushUser = (text: string) => {
    if (!text.trim()) return;
    setChat((c) => [...c, { role: "user", text: text.trim(), ts: Date.now() }]);
  };

  // Mic level setup
  const startLevelMeter = (stream: MediaStream) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current!;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      const data = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);
      analyserRef.current = analyser;

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        // Compute RMS to approximate volume
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setMicLevel(Math.min(1, rms * 3)); // scale
        levelRAFRef.current = requestAnimationFrame(tick);
      };
      if (levelRAFRef.current) cancelAnimationFrame(levelRAFRef.current);
      levelRAFRef.current = requestAnimationFrame(tick);
    } catch {
      // ignore
    }
  };
  const stopLevelMeter = () => {
    try {
      if (levelRAFRef.current) cancelAnimationFrame(levelRAFRef.current);
      levelRAFRef.current = null;
      analyserRef.current?.disconnect();
      analyserRef.current = null;
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close().catch(() => {});
      }
    } catch {}
    audioContextRef.current = null;
    setMicLevel(0);
  };

  // start recorder with Groq STT
  const startRecorder = async () => {
    try {
      if (recorderRef.current || !stoppedRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      startLevelMeter(stream); // start mic level meter
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = rec;
      stoppedRef.current = false;

      setTranscript("");
      setLiveUserUtterance("");
      setStartedAt(Date.now());

      rec.ondataavailable = async (ev: BlobEvent) => {
        if (stoppedRef.current) return;
        const blob = ev.data;
        if (!blob || blob.size === 0) return;
        if (sendingRef.current) return;
        sendingRef.current = true;
        try {
          const buf = await blob.arrayBuffer();
          const text = await transcribeChunk({
            audio: new Uint8Array(buf) as any,
            mimeType: blob.type || mime,
            prompt:
              interviewType === "Technical"
                ? "Technical interview context. Use concise phrasing and preserve jargon."
                : interviewType === "HR"
                ? "HR/behavioral interview context. Clean up filler words but keep meaning."
                : "Job interview context. Transcribe clearly and concisely.",
          });
          if (!stoppedRef.current && text) {
            if (!startedAt) setStartedAt(Date.now());
            // Stream into the live utterance and full transcript for reliability
            setLiveUserUtterance((prev) => (prev && !prev.endsWith(" ") ? prev + " " + text : (prev || "") + text));
            setTranscript((prev) => (prev && !prev.endsWith(" ") ? prev + " " + text : (prev || "") + text));
          }
        } catch {
          // swallow transient errors to keep stream alive
        } finally {
          sendingRef.current = false;
        }
      };

      rec.onerror = () => {
        toast.error("Microphone error. Please check permission.");
        stopRecorder();
      };

      // Smaller timeslice for more instantaneous updates
      rec.start(250);
    } catch (e: any) {
      toast.error(e?.message || "Failed to access microphone");
      stopRecorder();
    }
  };
  const stopRecorder = () => {
    stoppedRef.current = true;
    try {
      recorderRef.current?.stop();
    } catch {}
    recorderRef.current = null;
    mediaStreamRef.current?.getTracks()?.forEach((t) => {
      try {
        t.stop();
      } catch {}
    });
    mediaStreamRef.current = null;
    stopLevelMeter();
  };

  // timer tick
  useEffect(() => {
    if (!open) return;
    if (!sessionActive || remainingSec <= 0) return;
    const id = window.setInterval(() => {
      setRemainingSec((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          handleEndSession();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, sessionActive, remainingSec]);

  // lifecycle cleanup
  useEffect(() => {
    if (!open) {
      // ensure stop everything when closed
      stopRecorder();
      stopSpeak();
      setSessionActive(false);
      setShowSummary(false);
      setChat([]); // reset chat on close for clarity
      setLiveUserUtterance("");
    }
    return () => {
      stopRecorder();
      stopSpeak();
      stopLevelMeter();
    };
  }, [open]);

  const startSession = async () => {
    if (!jd || !jd.trim()) {
      toast.error("Provide/select a job description first.");
      return;
    }
    const target = deriveTargetQuestions(durationMin);
    setTargetQuestions(target);
    try {
      const out = await genQs({
        jd,
        count: target,
        interviewType,
        resumeFileId: (resumeFileId as any) || undefined,
      });
      const list = (out || []) as string[];
      setQuestions(list);
      setQIndex(0);
      const firstQ = list[0] || "Tell me about yourself.";
      setQuestion(firstQ);
      // speak and bubble
      speak(firstQ);
      pushAi(firstQ);
    } catch {
      const fallback = "Tell me about yourself.";
      setQuestions([fallback]);
      setQIndex(0);
      setQuestion(fallback);
      speak(fallback);
      pushAi(fallback);
    }
    // reset stats
    setQuestionsAsked(0);
    setMetricsLog([]);
    setSessionTranscript("");
    setShowSummary(false);
    setFeedback("");
    setFeedbackLoading(false);
    setChat([]); // fresh thread
    setLiveUserUtterance("");

    // start timer and mic
    setRemainingSec(durationMin * 60);
    setSessionActive(true);
    await startRecorder();
    toast.success("Live interview started");
  };

  const handleUserDoneSpeaking = async () => {
    // finalize current utterance as a user bubble
    const t = (liveUserUtterance || transcript).trim();
    if (t) {
      setSessionTranscript((prev) => `${prev} ${t}`.trim());
      setMetricsLog((prev) => [...prev, computeMetrics(t, startedAt)]);
      pushUser(t);
    }
    // stop and restart recorder to mark boundary
    stopRecorder();
    setTranscript("");
    setLiveUserUtterance("");
    setStartedAt(null);

    // decide follow-up vs next
    let followupsPlanned = interviewType === "HR" ? 0 : 1;
    if (followupsPlanned > 0) {
      try {
        const q = await followUp({
          previousQuestion: question,
          userAnswer: t || "(no answer captured)",
          jd,
          interviewType,
        });
        const f = (q || "").trim() || "Can you elaborate on the measurable impact and trade-offs?";
        setQuestion(f);
        speak(f);
        pushAi(f);
        await startRecorder();
        return;
      } catch {
        // fall-through to next if follow-up fails
      }
    }
    handleNextQuestion();
  };

  const handleNextQuestion = async () => {
    const pool = questions;
    const nextIdx = Math.min(qIndex + 1, Math.max(pool.length - 1, 0));
    const t = (liveUserUtterance || transcript).trim();
    if (t) {
      setSessionTranscript((prev) => `${prev} ${t}`.trim());
      setMetricsLog((prev) => [...prev, computeMetrics(t, startedAt)]);
      pushUser(t);
    }
    setQuestionsAsked((n) => n + 1);
    if (questionsAsked + 1 >= targetQuestions) {
      handleEndSession();
      return;
    }
    setQIndex(nextIdx);
    const q = pool[nextIdx] || "What's a recent challenge you solved?";
    setQuestion(q);
    stopSpeak();
    speak(q);
    pushAi(q);
    // reset capture
    setTranscript("");
    setLiveUserUtterance("");
    setStartedAt(null);
    if (stoppedRef.current) {
      await startRecorder();
    }
  };

  const handleEndSession = () => {
    const t = (liveUserUtterance || transcript).trim();
    if (t) {
      setSessionTranscript((prev) => `${prev} ${t}`.trim());
      setMetricsLog((prev) => [...prev, computeMetrics(t, startedAt)]);
      pushUser(t);
    }
    setSessionActive(false);
    stopRecorder();
    stopSpeak();
    setShowSummary(true);
    void generateFeedback();
  };

  const generateFeedback = async () => {
    const combined = `${sessionTranscript} ${transcript}`.trim();
    if (!combined) return;
    try {
      setFeedbackLoading(true);
      const out = await sessionFeedback({
        transcript: combined.slice(0, 12000),
        jd,
        interviewType,
      });
      setFeedback(out || "");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const summary = useMemo(() => {
    if (!showSummary || metricsLog.length === 0) return null;
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    const avgWpm = avg(metricsLog.map((m) => m.wpm));
    const avgFpm = avg(metricsLog.map((m) => m.fillerPerMin));
    const avgConf = avg(metricsLog.map((m) => m.confidence));
    return {
      avgWpm,
      avgFpm,
      avgConf,
      totalQuestions: metricsLog.length,
      durationMin,
    };
  }, [showSummary, metricsLog, durationMin]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm">
      {/* Header / Meeting bar */}
      <div className="absolute top-0 left-0 right-0 h-12 border-b bg-background/90 flex items-center justify-between px-4 z-[85]">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">AI Recruiter Call</Badge>
          <div className="text-muted-foreground">•</div>
          <div className="text-sm">
            Round: <span className="font-semibold">{interviewType}</span>
          </div>
          <div className="text-muted-foreground">•</div>
          <div className="text-sm">
            Questions: <span className="font-semibold">{questionsAsked}/{targetQuestions || "-"}</span>
          </div>
          <div className="text-muted-foreground">•</div>
          <div className="text-sm">
            {sessionActive ? (
              <>
                Time left: <span className="font-semibold">
                  {Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, "0")}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Ready</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mic level mini meter */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-2 w-20 rounded bg-muted overflow-hidden">
              <div
                className="h-2 bg-green-500 transition-[width] duration-150"
                style={{ width: `${Math.round(micLevel * 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">Mic</span>
          </div>

          {!sessionActive ? (
            <Button size="sm" variant="ghost" onClick={() => { stopRecorder(); stopSpeak(); onClose(); }}>
              <X className="h-4 w-4 mr-2" /> Close
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={handleEndSession}>
              End Session
            </Button>
          )}
        </div>
      </div>

      {/* Main layout: Stage + Sidebar */}
      <div className="absolute left-0 right-0 top-12 bottom-20 grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-4 p-4 overflow-hidden">
        {/* Stage */}
        <div className="relative rounded-xl border bg-muted/10 overflow-hidden">
          <div className="grid grid-rows-[1fr,auto] h-full">
            {/* Video tiles area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
              {/* AI tile */}
              <div className="relative rounded-2xl border bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" />
                <div className="h-full flex flex-col items-center justify-center p-6">
                  <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/30 grid place-items-center mb-3 shadow-[0_0_30px_rgba(59,130,246,0.25)]">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <div className="text-sm font-semibold">AI Recruiter</div>
                  <div className="text-xs text-muted-foreground">Speaking via TTS</div>
                </div>
                {/* Current AI question (overlay chip) with glow */}
                {sessionActive && question && (
                  <div className="absolute left-3 bottom-3 max-w-[85%]">
                    <div className="rounded-full bg-background/95 border px-3 py-1.5 text-xs shadow ring-1 ring-primary/30 animate-in fade-in slide-in-from-bottom-1">
                      Q: {question}
                    </div>
                  </div>
                )}
              </div>

              {/* User tile */}
              <div className="relative rounded-2xl border bg-gradient-to-br from-secondary/10 to-primary/10 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" />
                <div className="h-full flex flex-col items-center justify-center p-6">
                  <div className="w-20 h-20 rounded-full bg-muted grid place-items-center mb-3 border shadow-[0_0_30px_rgba(34,197,94,0.20)]">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="text-sm font-semibold">You</div>
                  <div className="text-xs text-muted-foreground">
                    {(!stoppedRef.current && sessionActive) ? (
                      <span className="text-green-600 dark:text-green-400">Listening…</span>
                    ) : (
                      "Mic idle"
                    )}
                  </div>

                  {/* Embedded mic level bar */}
                  <div className="mt-3 w-40 h-2 rounded bg-muted overflow-hidden">
                    <div
                      className="h-2 bg-green-500 transition-[width] duration-150"
                      style={{ width: `${Math.round(micLevel * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Live utterance overlay bubble with glow */}
                {sessionActive && (liveUserUtterance || transcript) && (
                  <div className="absolute right-3 bottom-3 max-w-[85%] animate-in slide-in-from-bottom-2 fade-in">
                    <div className="rounded-2xl rounded-tr-sm bg-primary/90 text-primary-foreground px-3 py-2 text-sm shadow ring-2 ring-primary/30">
                      {(liveUserUtterance || transcript) || ""}
                      <span className="inline-block w-2 h-2 bg-primary-foreground rounded-full ml-2 animate-pulse align-middle" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Spacer where old dock was; keep empty */}
            <div className="relative">
              <div className="h-2" />
            </div>
          </div>
        </div>

        {/* Sidebar: Chat & Summary */}
        <div className="rounded-xl border bg-background p-4 flex flex-col overflow-hidden">
          {/* Quick metrics */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {(() => {
              const m = computeMetrics(liveUserUtterance || transcript, startedAt);
              return (
                <>
                  <Stat label="WPM" value={m.wpm} accent="text-primary" />
                  <Stat label="Fillers" value={m.fillerCount} />
                  <Stat label="Fillers/min" value={m.fillerPerMin} />
                  <Stat label="Confidence" value={`${m.confidence}%`} accent="text-green-600 dark:text-green-500" />
                </>
              );
            })()}
          </div>

          {/* Duration/type selectors (only when idle) */}
          {!sessionActive && !showSummary && (
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              <div className="flex rounded-md border overflow-hidden">
                <button
                  className={`px-3 py-1.5 text-xs ${durationMin === 30 ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setDurationMin(30)}
                >30m</button>
                <button
                  className={`px-3 py-1.5 text-xs border-l ${durationMin === 60 ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setDurationMin(60)}
                >60m</button>
                <button
                  className={`px-3 py-1.5 text-xs border-l ${durationMin === 90 ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setDurationMin(90)}
                >90m</button>
              </div>
              <div className="flex rounded-md border overflow-hidden">
                <button
                  className={`px-3 py-1.5 text-xs ${interviewType === "Intro" ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setInterviewType("Intro")}
                >Intro</button>
                <button
                  className={`px-3 py-1.5 text-xs border-l ${interviewType === "Technical" ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setInterviewType("Technical")}
                >Technical</button>
                <button
                  className={`px-3 py-1.5 text-xs border-l ${interviewType === "HR" ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setInterviewType("HR")}
                >HR</button>
              </div>
            </div>
          )}

          {/* Call Bubbles (scrollable) */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {/* Current question bubble (when active) */}
            {sessionActive && question && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 grid place-items-center shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.25)]">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-primary/10 border border-primary/20 px-3 py-2 text-sm max-w-[85%] ring-1 ring-primary/10">
                  {question}
                </div>
              </div>
            )}

            {/* History bubbles with soft glow */}
            {chat.map((m, i) =>
              m.role === "ai" ? (
                <div key={m.ts + ":" + i} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 grid place-items-center shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.25)]">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-background border px-3 py-2 text-sm max-w-[85%] ring-1 ring-primary/5">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.ts + ":" + i} className="flex items-start gap-2 justify-end">
                  <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3 py-2 text-sm max-w-[85%] shadow ring-2 ring-primary/30">
                    {m.text}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted grid place-items-center shrink-0 shadow-[0_0_12px_rgba(34,197,94,0.20)]">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )
            )}

            {/* Summary */}
            {showSummary && (
              <div className="mt-2 space-y-3">
                <div className="text-sm font-semibold">Session Summary</div>
                {summary ? (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      <Stat label="Avg WPM" value={summary.avgWpm} accent="text-primary" />
                      <Stat label="Avg Fillers/min" value={summary.avgFpm} />
                      <Stat label="Avg Confidence" value={`${summary.avgConf}%`} accent="text-green-600 dark:text-green-500" />
                      <Stat label="Questions" value={summary.totalQuestions} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Duration: ~{summary.durationMin} min • Round: {interviewType}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">No metrics collected.</div>
                )}

                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-semibold">AI Feedback</div>
                  {feedbackLoading ? (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating feedback...
                    </div>
                  ) : feedback ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                      {feedback}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No feedback available.</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`${feedback}\n\nTranscript:\n${sessionTranscript}`);
                        toast.success("Copied feedback & transcript");
                      } catch {
                        toast.error("Copy failed");
                      }
                    }}
                  >
                    <Clipboard className="h-4 w-4 mr-2" /> Copy Summary
                  </Button>
                  <Button size="sm" onClick={() => { setShowSummary(false); }}>
                    Close Summary
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Live transcript editor for manual corrections */}
          <div className="mt-3 space-y-2">
            <Badge variant="outline" className="w-fit">Live transcript (editable)</Badge>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your spoken words will appear here..."
              className="min-h-40"
            />
            {liveUserUtterance && (
              <div className="text-xs text-muted-foreground -mt-1">
                Capturing speech... partial: {liveUserUtterance.slice(-120)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed bottom control dock (always accessible) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] pointer-events-auto">
        <div className="rounded-full border bg-background/95 shadow-xl px-3 py-2 flex items-center gap-2">
          {/* Start/Stop Mic */}
          {sessionActive && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                if (stoppedRef.current) startRecorder();
                else stopRecorder();
              }}
            >
              {stoppedRef.current ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
              {stoppedRef.current ? "Start Mic" : "Stop Mic"}
            </Button>
          )}

          {/* Mute/Unmute AI */}
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => setMuted((m) => !m)}
          >
            {muted ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
            {muted ? "Unmute AI" : "Mute AI"}
          </Button>

          {/* Done speaking */}
          {sessionActive && (
            <Button size="sm" className="rounded-full" onClick={handleUserDoneSpeaking}>
              I'm Done Speaking
            </Button>
          )}

          {/* Next question */}
          {sessionActive && (
            <Button size="sm" variant="outline" className="rounded-full" onClick={handleNextQuestion}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {/* Start/End session */}
          {!sessionActive ? (
            <Button size="sm" className="rounded-full" onClick={startSession} disabled={!jd}>
              Start Live Interview
            </Button>
          ) : (
            <Button size="sm" variant="destructive" className="rounded-full" onClick={handleEndSession}>
              End
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}