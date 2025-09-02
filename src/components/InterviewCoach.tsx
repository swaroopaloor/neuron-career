import { useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, Sparkles, Loader2, ChevronRight, Clipboard } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RecognitionType = any;

const FILLERS = [
  "um","uh","like","you know","so","actually","basically","kind of","sort of","i guess","well","right","okay",
];

function computeMetrics(transcript: string, startedAt: number | null) {
  const text = transcript.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const durationMin = startedAt ? Math.max((Date.now() - startedAt) / 60000, 0.01) : 0.01;
  const wpm = Math.round(words.length / durationMin);

  let fillerCount = 0;
  for (const f of FILLERS) {
    const regex = new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    fillerCount += (text.match(regex) || []).length;
  }
  const fillerPerMin = Math.round(fillerCount / durationMin);

  // Confidence heuristic: start at 100, penalize filler and extreme pacing
  let confidence = 100;
  confidence -= Math.min(fillerPerMin * 2, 40); // filler penalty
  const pacePenalty = wpm < 90 ? (90 - wpm) * 0.3 : wpm > 170 ? (wpm - 170) * 0.3 : 0;
  confidence -= Math.min(Math.max(pacePenalty, 0), 35);
  confidence = Math.max(5, Math.min(100, Math.round(confidence)));

  return { wpm, fillerCount, fillerPerMin, confidence };
}

function useSpeechRecognition(onResult: (partial: string) => void) {
  const [supported, setSupported] = useState<boolean>(false);
  const [listening, setListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const SpeechRecognitionRef = useRef<any>(null);
  const restartTimeout = useRef<number | null>(null);

  useEffect(() => {
    // Detect support on mount but don't construct the instance yet (iOS Safari quirk).
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      SpeechRecognitionRef.current = SpeechRecognition;
      setSupported(true);
    } else {
      setSupported(false);
    }
    return () => {
      if (restartTimeout.current) {
        window.clearTimeout(restartTimeout.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const start = async () => {
    if (!SpeechRecognitionRef.current) {
      setSupported(false);
      return;
    }
    if (listening) return;

    // Lazily construct a new instance each time start is called to avoid stale handlers on iOS.
    try {
      const rec = new SpeechRecognitionRef.current();
      recognitionRef.current = rec;

      // Some browsers behave better with continuous false and manual restart.
      // We'll still collect interim results for live transcript.
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          interim += e.results[i][0].transcript;
        }
        onResult(interim);
      };

      rec.onerror = (ev: any) => {
        // Common errors: "no-speech", "audio-capture" (no mic), "not-allowed" (permission)
        // Gracefully fall back to typing if persistent error
        // But attempt a single auto-restart for transient issues
        if (listening) {
          try {
            rec.stop();
          } catch {}
          if (restartTimeout.current) window.clearTimeout(restartTimeout.current);
          restartTimeout.current = window.setTimeout(() => {
            if (listening) {
              start().catch(() => {
                setListening(false);
                setSupported(false);
              });
            }
          }, 500);
        } else {
          setSupported(false);
        }
      };

      rec.onend = () => {
        // Auto-restart to simulate continuous mode across mobile browsers
        if (listening) {
          if (restartTimeout.current) window.clearTimeout(restartTimeout.current);
          restartTimeout.current = window.setTimeout(() => {
            if (listening) {
              start().catch(() => {
                setListening(false);
                setSupported(false);
              });
            }
          }, 200);
        }
      };

      // Start after setting handlers
      rec.start();
      setListening(true);
    } catch {
      // If construction or start fails, disable voice mode
      setListening(false);
      setSupported(false);
    }
  };

  const stop = () => {
    if (!recognitionRef.current) {
      setListening(false);
      return;
    }
    try {
      // Stop and prevent auto-restart
      setListening(false);
      if (restartTimeout.current) {
        window.clearTimeout(restartTimeout.current);
        restartTimeout.current = null;
      }
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
  };

  return { supported, listening, start, stop };
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border px-3 py-2">
      <div className={`text-lg font-bold ${accent ?? ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

export default function InterviewCoach({
  jobDescription,
  resumeFileId,
  initialQuestions,
  initialIndex,
  onSessionUpdate,
}: {
  jobDescription?: string;
  resumeFileId?: string;
  initialQuestions?: string[]; // prefill from saved session
  initialIndex?: number;       // prefill from saved session
  onSessionUpdate?: (qs: string[], idx: number) => void; // notify parent to persist
}) {
  // Share questions and current index across Voice Mirror and Q&A Drills
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);

  // Initialize from saved session (once)
  useEffect(() => {
    if (initialQuestions && initialQuestions.length && questions.length === 0) {
      setQuestions(initialQuestions);
      setCurrentIdx(typeof initialIndex === "number" ? Math.max(0, Math.min(initialIndex, initialQuestions.length - 1)) : 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestions, initialIndex]);

  // Report changes upward for persistence
  useEffect(() => {
    if (onSessionUpdate) onSessionUpdate(questions, currentIdx);
  }, [questions, currentIdx, onSessionUpdate]);

  return (
    <div className="space-y-4">
      {jobDescription && (
        <div className="rounded-md border p-3 text-xs text-muted-foreground">
          Using selected analysis job description for tailoring.
        </div>
      )}

      {/* Switchable layout with Tabs */}
      <Tabs defaultValue="drills" className="w-full">
        <div className="flex items-center justify-between mb-3">
          <TabsList>
            <TabsTrigger value="drills">Q&A Drills</TabsTrigger>
            <TabsTrigger value="voice">Live Interview</TabsTrigger>
          </TabsList>
          {!!questions.length && currentIdx >= 0 && (
            <Badge variant="secondary" className="text-xs">
              Q {currentIdx + 1} of {questions.length}
            </Badge>
          )}
        </div>

        <TabsContent value="drills">
          <QADrills
            jobDescription={jobDescription}
            resumeFileId={resumeFileId}
            sharedQuestions={questions}
            setSharedQuestions={setQuestions}
          />
        </TabsContent>

        <TabsContent value="voice">
          <VoiceMirror
            jobDescription={jobDescription}
            resumeFileId={resumeFileId}
            sharedQuestions={questions}
            currentIdx={currentIdx}
            onPrev={() => setCurrentIdx(Math.max(currentIdx - 1, 0))}
            onNext={() => setCurrentIdx(Math.min(currentIdx + 1, Math.max(questions.length - 1, 0)))}
            onJump={(idx) => setCurrentIdx(idx)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QADrills({
  jobDescription,
  resumeFileId,
  sharedQuestions,
  setSharedQuestions,
}: {
  jobDescription?: string;
  resumeFileId?: string;
  sharedQuestions?: string[];
  setSharedQuestions?: (qs: string[]) => void;
}) {
  const [localQs, setLocalQs] = useState<string[]>([]);
  const questions = sharedQuestions ?? localQs;
  const setQuestions = setSharedQuestions ?? setLocalQs;

  const [idx, setIdx] = useState<number>(-1);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [answerLoading, setAnswerLoading] = useState(false);

  const genQs = useAction(api.aiInterview.generateQuestions);
  const suggest = useAction(api.aiInterview.suggestAnswer);

  const currentQuestion = idx >= 0 && idx < questions.length ? questions[idx] : "";

  const start = async () => {
    if (!jobDescription) {
      toast.error("Provide or select a job description first in setup.");
      return;
    }
    try {
      setLoading(true);
      const out = await genQs({ jd: jobDescription, count: 50 });
      setQuestions(out);
      setIdx(0);
      setAnswers({});
      toast.success("Generated 50 Q&A prompts");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const ensureAnswer = async (at: number) => {
    if (answers[at] || !questions[at]) return;
    try {
      setAnswerLoading(true);
      const a = await suggest({
        question: questions[at],
        jd: jobDescription,
        resumeFileId: resumeFileId as any,
      });
      setAnswers((prev) => ({ ...prev, [at]: a }));
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate suggested answer");
    } finally {
      setAnswerLoading(false);
    }
  };

  useEffect(() => {
    if (idx >= 0) {
      void ensureAnswer(idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, questions.length]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Q&A Drills</CardTitle>
        <CardDescription className="text-sm">
          50 tailored questions with AI-suggested answers based on your resume and JD.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!questions.length ? (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={start} disabled={loading || !jobDescription}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Start Drills
            </Button>
            {!jobDescription && (
              <div className="text-xs text-muted-foreground">
                Select or paste a job description in setup first.
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Current</div>
              <div className="text-xs text-muted-foreground">
                {idx + 1} / {questions.length}
              </div>
            </div>

            <div className="rounded-lg border p-3 text-sm">
              <span className="font-semibold mr-1">Q:</span>
              {currentQuestion}
            </div>

            <div className="rounded-lg border p-3 min-h-24 text-sm whitespace-pre-wrap bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">Suggested Answer</Badge>
                {answerLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {answers[idx] ? answers[idx] : (
                <span className="text-muted-foreground">Generating answer...</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIdx(Math.max(idx - 1, 0))}
                disabled={idx <= 0}
              >
                Prev
              </Button>
              <div className="text-xs text-muted-foreground">
                Answers are auto-tailored using your resume & JD.
              </div>
              <Button
                size="sm"
                onClick={() => setIdx(Math.min(idx + 1, questions.length - 1))}
                disabled={idx >= questions.length - 1}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <Separator />
            <div>
              <SectionHeader title="All Questions" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                {questions.map((q, i) => (
                  <button
                    key={`${i}-${q.slice(0, 12)}`}
                    onClick={() => setIdx(i)}
                    className={`text-left rounded-md border p-2 text-xs hover:bg-secondary transition ${
                      i === idx ? "border-primary" : "border-border"
                    }`}
                  >
                    <span className="font-medium mr-1">{i + 1}.</span>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function VoiceMirror({
  jobDescription,
  resumeFileId,
  sharedQuestions,
  currentIdx,
  onPrev,
  onNext,
  onJump,
}: {
  jobDescription?: string;
  resumeFileId?: string;
  sharedQuestions?: string[];
  currentIdx?: number;
  onPrev?: () => void;
  onNext?: () => void;
  onJump?: (idx: number) => void;
}) {
  const [question, setQuestion] = useState<string>("Tell me about yourself.");
  const [transcript, setTranscript] = useState<string>("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finalAnswer, setFinalAnswer] = useState<string>("");
  const [polished, setPolished] = useState<string>("");
  const [polishing, setPolishing] = useState(false);

  // NEW: session controls
  const [durationMin, setDurationMin] = useState<number>(10);
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [targetQuestions, setTargetQuestions] = useState<number>(0);
  const [questionsAsked, setQuestionsAsked] = useState<number>(0);
  const [metricsLog, setMetricsLog] = useState<Array<{ wpm: number; fillerPerMin: number; confidence: number }>>([]);
  const [sessionTranscript, setSessionTranscript] = useState<string>("");
  const [showSummary, setShowSummary] = useState<boolean>(false);

  // derive questions target from duration
  const deriveTargetQuestions = (mins: number) => {
    if (mins <= 5) return 3;
    if (mins <= 10) return 6;
    if (mins <= 20) return 12;
    return Math.max(12, Math.round(mins * 0.6));
  };

  // When sharedQuestions/index change, align current question for continuity (only when not in active session)
  useEffect(() => {
    if (sessionActive) return;
    if (sharedQuestions && typeof currentIdx === "number" && currentIdx >= 0 && currentIdx < sharedQuestions.length) {
      setQuestion(sharedQuestions[currentIdx]);
    }
  }, [sharedQuestions, currentIdx, sessionActive]);

  const onResult = (partial: string) => {
    if (!startedAt) setStartedAt(Date.now());
    setTranscript(partial);
  };

  const { supported, listening, start, stop } = useSpeechRecognition(onResult);
  const metrics = useMemo(() => computeMetrics(transcript, startedAt), [transcript, startedAt]);

  const followUp = useAction(api.aiInterview.nextFollowUp);
  const polish = useAction(api.aiInterview.polishAnswer);
  const suggest = useAction(api.aiInterview.suggestAnswer);
  const genQs = useAction(api.aiInterview.generateQuestions); // NEW: to seed live session if needed

  // timer tick
  useEffect(() => {
    if (!sessionActive || remainingSec <= 0) return;
    const id = window.setInterval(() => {
      setRemainingSec((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          endSession();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [sessionActive, remainingSec]);

  // Start session
  const startSession = async () => {
    if (!jobDescription) {
      toast.error("Provide or select a job description first in setup.");
      return;
    }
    const target = deriveTargetQuestions(durationMin);
    setTargetQuestions(target);
    // Seed a relevant question set if none present
    try {
      if (!sharedQuestions || sharedQuestions.length < target) {
        const out = await genQs({ jd: jobDescription, count: target });
        if (out && out.length) {
          setQuestion(out[0]);
          onJump && onJump(0);
        }
      } else {
        setQuestion(sharedQuestions[0]);
        onJump && onJump(0);
      }
    } catch {
      // fallback to existing/default question if generation fails
    }
    // reset session stats
    setQuestionsAsked(0);
    setMetricsLog([]);
    setSessionTranscript("");
    setShowSummary(false);
    // start timer
    setRemainingSec(durationMin * 60);
    setSessionActive(true);
    toast.success("Live interview started");
  };

  // End session and compute summary
  const endSession = () => {
    // log last answer snippet if present
    if (transcript.trim().length) {
      setSessionTranscript((prev) => `${prev} ${transcript}`.trim());
      setMetricsLog((prev) => [...prev, metrics]);
    }
    setSessionActive(false);
    setShowSummary(true);
    if (listening) {
      try { stop(); } catch {}
    }
  };

  // Move to a new fresh question (counts toward quota)
  const handleNewQuestion = () => {
    if (!sessionActive) {
      if (sharedQuestions && sharedQuestions.length) {
        const rand = Math.floor(Math.random() * sharedQuestions.length);
        setQuestion(sharedQuestions[rand]);
        setTranscript("");
        setStartedAt(null);
        setFinalAnswer("");
        setPolished("");
        toast.success("New question loaded");
      } else {
        toast.message("Tip", { description: "Generate 50 Q&A in Drills to diversify questions." as any });
      }
      return;
    }

    // log metrics for the just-answered question
    if (transcript.trim().length) {
      setSessionTranscript((prev) => `${prev} ${transcript}`.trim());
      setMetricsLog((prev) => [...prev, metrics]);
    }
    setQuestionsAsked((n) => n + 1);

    // advance or end if reached target
    if (questionsAsked + 1 >= targetQuestions) {
      endSession();
      return;
    }

    if (sharedQuestions && sharedQuestions.length) {
      const rand = Math.floor(Math.random() * sharedQuestions.length);
      setQuestion(sharedQuestions[rand]);
    }
    setTranscript("");
    setStartedAt(null);
    setFinalAnswer("");
    setPolished("");
    toast.success("Next question");
  };

  const handleFollowUp = async () => {
    const answer = (finalAnswer || transcript).trim();
    if (!answer) {
      toast.error("Answer first (speak or type), then ask for a follow-up.");
      return;
    }
    try {
      const q = await followUp({ previousQuestion: question, userAnswer: answer, jd: jobDescription });
      setQuestion(q || "Can you go deeper on the impact and tradeoffs?");
      // reset state for the next answer; do NOT count toward target unless new question
      setTranscript("");
      setStartedAt(null);
      setFinalAnswer("");
      setPolished("");
      toast.success("Follow-up loaded");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate follow-up");
    }
  };

  const handlePolish = async () => {
    const text = (finalAnswer || transcript).trim();
    if (!text) {
      toast.error("Provide an answer first (speak or type).");
      return;
    }
    try {
      setPolishing(true);
      const out = await polish({ question, answer: text, jd: jobDescription });
      setPolished(out);
      toast.success("Polished answer generated");
    } catch (e: any) {
      toast.error(e?.message ? `Failed: ${e.message}` : "Failed to generate polished answer");
    } finally {
      setPolishing(false);
    }
  };

  const handleSuggest = async () => {
    try {
      const out = await suggest({ question, jd: jobDescription, resumeFileId: resumeFileId as any });
      setFinalAnswer(out);
      toast.success("Suggested answer generated");
    } catch (e: any) {
      toast.error(e?.message ? `Failed: ${e.message}` : "Failed to suggest answer");
    }
  };

  const resetRecording = () => {
    setTranscript("");
    setStartedAt(null);
    setFinalAnswer("");
    setPolished("");
  };

  // Summary calculations
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Live Interview Practice</CardTitle>
        <CardDescription className="text-sm">
          Timed, realistic interview. Choose a duration; questions and follow-ups adapt to your JD and resume.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session controls */}
        {!sessionActive && !showSummary && (
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="w-fit">Session setup</Badge>
            <div className="flex items-center gap-2 text-sm">
              <span>Duration:</span>
              <div className="flex rounded-md border overflow-hidden">
                <button
                  className={`px-3 py-1.5 text-xs ${durationMin === 5 ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setDurationMin(5)}
                >
                  5m
                </button>
                <button
                  className={`px-3 py-1.5 text-xs border-l ${durationMin === 10 ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setDurationMin(10)}
                >
                  10m
                </button>
                <button
                  className={`px-3 py-1.5 text-xs border-l ${durationMin === 20 ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setDurationMin(20)}
                >
                  20m
                </button>
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                Target ~{deriveTargetQuestions(durationMin)} questions
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" onClick={startSession} disabled={!jobDescription}>
                Start Live Interview
              </Button>
            </div>
          </div>
        )}

        {/* Timer & counters */}
        {sessionActive && (
          <div className="flex items-center justify-between rounded-md border p-2 text-sm">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">Live</Badge>
              <div>
                Time left: <span className="font-semibold">{Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, "0")}</span>
              </div>
              <div className="text-muted-foreground">•</div>
              <div>
                Questions: <span className="font-semibold">{questionsAsked}/{targetQuestions}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={endSession}>End Session</Button>
            </div>
          </div>
        )}

        {/* Summary */}
        {showSummary && summary && (
          <div className="rounded-lg border p-3 space-y-3">
            <div className="text-sm font-semibold">Session Summary</div>
            <div className="grid grid-cols-4 gap-2">
              <Stat label="Avg WPM" value={summary.avgWpm} accent="text-primary" />
              <Stat label="Avg Fillers/min" value={summary.avgFpm} />
              <Stat label="Avg Confidence" value={`${summary.avgConf}%`} accent="text-green-600 dark:text-green-500" />
              <Stat label="Questions" value={summary.totalQuestions} />
            </div>
            <div className="text-xs text-muted-foreground">
              Duration: ~{summary.durationMin} min • Keep practicing to improve pacing and reduce fillers.
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => { setShowSummary(false); }}>Close Summary</Button>
            </div>
          </div>
        )}

        {/* Question */}
        <SectionHeader title="Question" />
        <div className="flex items-center gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter the interview question"
          />
        </div>

        <Separator />
        <SectionHeader title="Record or type your answer" description="Use your mic or type. Metrics update in real-time." />
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => (listening ? stop() : start())}
            variant={listening ? "destructive" : "default"}
          >
            {listening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
            {listening ? "Stop" : "Start"} Recording
          </Button>
          <Button size="sm" variant="outline" onClick={resetRecording}>
            Reset
          </Button>
          <div className="mx-2 h-5 w-px bg-border" />
          <Button size="sm" variant="outline" onClick={handleNewQuestion}>
            New Question
          </Button>
          <Button size="sm" variant="outline" onClick={handleFollowUp}>
            Follow-up
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Stat label="WPM" value={metrics.wpm} accent="text-primary" />
          <Stat label="Fillers" value={metrics.fillerCount} />
          <Stat label="Fillers/min" value={metrics.fillerPerMin} />
          <Stat label="Confidence" value={`${metrics.confidence}%`} accent="text-green-600 dark:text-green-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit">Live transcript</Badge>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your spoken words will appear here (or type manually)"
              className="min-h-32"
            />
          </div>
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit">Your draft (optional)</Badge>
            <Textarea
              value={finalAnswer}
              onChange={(e) => setFinalAnswer(e.target.value)}
              placeholder="Paste or type a refined answer to polish"
              className="min-h-32"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={handlePolish} disabled={polishing}>
            {polishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate Polished Answer
          </Button>
          <Button size="sm" variant="outline" onClick={handleSuggest}>
            <Sparkles className="h-4 w-4 mr-2" />
            Suggest Answer (AI)
          </Button>
          {polished && (
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(polished); toast.success("Copied polished answer"); }}>
              <Clipboard className="h-4 w-4 mr-2" />
              Copy
            </Button>
          )}
        </div>

        {polished && (
          <div className="rounded-lg border p-3">
            <div className="text-sm font-semibold mb-2">Polished Answer</div>
            <p className="text-sm whitespace-pre-wrap">{polished}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}