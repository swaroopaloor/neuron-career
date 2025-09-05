import { useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mic, MicOff, Volume2, VolumeX, ChevronRight, Sparkles, Clipboard, X } from "lucide-react";
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

  // start recorder with Groq STT
  const startRecorder = async () => {
    try {
      if (recorderRef.current || !stoppedRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = rec;
      stoppedRef.current = false;

      setTranscript("");
      setStartedAt(Date.now());

      rec.ondataavailable = async (ev: BlobEvent) => {
        if (stoppedRef.current) return;
        const blob = ev.data;
        if (!blob || blob.size === 0) return;
        if (sendingRef.current) return; // drop overlapping to keep latency low
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
            setTranscript((prev) => (prev && !prev.endsWith(" ") ? prev + " " + text : (prev || "") + text));
          }
        } catch {
          // swallow transient errors
        } finally {
          sendingRef.current = false;
        }
      };

      rec.onerror = () => {
        toast.error("Microphone error. Please check permission.");
        stopRecorder();
      };

      rec.start(500);
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
    }
    return () => {
      stopRecorder();
      stopSpeak();
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
      setQuestion(list[0] || "Tell me about yourself.");
      // speak first question
      speak(list[0] || "Tell me about yourself.");
    } catch {
      // fallback question
      setQuestions(["Tell me about yourself."]);
      setQIndex(0);
      setQuestion("Tell me about yourself.");
      speak("Tell me about yourself.");
    }
    // reset stats
    setQuestionsAsked(0);
    setMetricsLog([]);
    setSessionTranscript("");
    setShowSummary(false);
    setFeedback("");
    setFeedbackLoading(false);
    // start timer and mic
    setRemainingSec(durationMin * 60);
    setSessionActive(true);
    await startRecorder();
    toast.success("Live interview started");
  };

  const handleUserDoneSpeaking = async () => {
    // snapshot current segment into logs
    const t = transcript.trim();
    if (t) {
      setSessionTranscript((prev) => `${prev} ${t}`.trim());
      setMetricsLog((prev) => [...prev, computeMetrics(transcript, startedAt)]);
    }
    // stop and restart recorder to mark boundary
    stopRecorder();
    setTranscript("");
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
        // resume mic
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
    const t = transcript.trim();
    if (t) {
      setSessionTranscript((prev) => `${prev} ${t}`.trim());
      setMetricsLog((prev) => [...prev, computeMetrics(transcript, startedAt)]);
    }
    setQuestionsAsked((n) => n + 1);
    if (questionsAsked + 1 >= targetQuestions) {
      handleEndSession();
      return;
    }
    setQIndex(nextIdx);
    const q = pool[nextIdx] || "What’s a recent challenge you solved?";
    setQuestion(q);
    stopSpeak();
    speak(q);
    // reset capture
    setTranscript("");
    setStartedAt(null);
    // ensure recorder running
    if (stoppedRef.current) {
      await startRecorder();
    }
  };

  const handleEndSession = () => {
    const t = transcript.trim();
    if (t) {
      setSessionTranscript((prev) => `${prev} ${t}`.trim());
      setMetricsLog((prev) => [...prev, computeMetrics(transcript, startedAt)]);
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
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm">
      <div className="absolute inset-0 grid grid-rows-[auto,1fr]">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background/80">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">AI Recruiter Call</Badge>
            {sessionActive ? (
              <div className="text-sm">
                Time left: <span className="font-semibold">{Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, "0")}</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Ready</div>
            )}
            <div className="text-muted-foreground">•</div>
            <div className="text-sm">
              Round: <span className="font-semibold">{interviewType}</span>
            </div>
            <div className="text-muted-foreground">•</div>
            <div className="text-sm">
              Questions: <span className="font-semibold">{questionsAsked}/{targetQuestions || "-"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setMuted((m) => !m)}>
              {muted ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
              {muted ? "Unmute AI" : "Mute AI"}
            </Button>
            {sessionActive ? (
              <Button size="sm" variant="destructive" onClick={handleEndSession}>End Session</Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => { stopRecorder(); stopSpeak(); onClose(); }}>
                <X className="h-4 w-4 mr-2" /> Close
              </Button>
            )}
          </div>
        </div>

        {/* Main */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-y-auto">
          {/* Left: AI recruiter */}
          <div className="rounded-xl border bg-gradient-to-br from-secondary/20 to-primary/10 p-4 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 grid place-items-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-semibold">AI Recruiter</div>
              </div>
              {!sessionActive && !showSummary && (
                <div className="flex items-center gap-2">
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
            </div>

            <div className="rounded-lg border bg-background/60 p-3">
              <div className="text-xs text-muted-foreground mb-1">Current question</div>
              <div className="text-sm font-medium">{question}</div>
            </div>

            {!sessionActive && !showSummary && (
              <div className="mt-4">
                <Button size="sm" onClick={startSession} disabled={!jd}>
                  Start Live Interview
                </Button>
                {!jd && <div className="text-xs text-muted-foreground mt-2">Select or paste a job description first.</div>}
              </div>
            )}

            {showSummary && (
              <div className="mt-4 space-y-3">
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

          {/* Right: You (live transcript & controls) */}
          <div className="rounded-xl border bg-background p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {(!stoppedRef.current && sessionActive) ? (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Listening...
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Mic idle</div>
                )}
              </div>
              {sessionActive && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (stoppedRef.current) startRecorder();
                      else stopRecorder();
                    }}
                  >
                    {stoppedRef.current ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
                    {stoppedRef.current ? "Start Mic" : "Stop Mic"}
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {(() => {
                const m = computeMetrics(transcript, startedAt);
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

            <div className="space-y-2">
              <Badge variant="outline" className="w-fit">Live transcript</Badge>
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your spoken words will appear here..."
                className="min-h-40"
              />
            </div>

            {sessionActive && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Button size="sm" onClick={handleUserDoneSpeaking}>
                  I’m Done Speaking
                </Button>
                <Button size="sm" variant="outline" onClick={handleNextQuestion}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
