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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const isStartingRef = useRef<boolean>(false);
  const finalBufferRef = useRef<string>("");

  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      SpeechRecognitionRef.current = SpeechRecognition;
      setSupported(true);
    } else {
      setSupported(false);
      console.warn("Speech recognition not supported in this browser");
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
          if (typeof recognitionRef.current.abort === "function") {
            recognitionRef.current.abort();
          }
        } catch (e) {
          // ignore
        } finally {
          recognitionRef.current = null;
        }
      }
    };
  }, []);

  const start = async () => {
    if (!SpeechRecognitionRef.current) {
      setSupported(false);
      return;
    }
    
    if (listening || isStartingRef.current) {
      return;
    }

    isStartingRef.current = true;

    try {
      // Request microphone permission first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permissionError) {
          console.error("Microphone permission denied:", permissionError);
          setSupported(false);
          isStartingRef.current = false;
          return;
        }
      }

      // Hard-stop any previous instance before starting a new one (prevents silent failures)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
          if (typeof recognitionRef.current.abort === "function") {
            recognitionRef.current.abort();
          }
        } catch (e) {
          // ignore
        } finally {
          recognitionRef.current = null;
        }
      }

      const rec = new SpeechRecognitionRef.current();
      recognitionRef.current = rec;

      // Configure recognition
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        // RESET buffer on start to avoid stale text
        finalBufferRef.current = "";
        // Force clear UI instantly so new words show immediately
        try { onResult(""); } catch {}
        setListening(true);
        isStartingRef.current = false;
        console.log("Speech recognition started");
      };

      rec.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          const t = res[0]?.transcript ?? "";
          if (!t) continue;
          if (res.isFinal) {
            // Add a space if needed between segments
            const needsSpace = finalBufferRef.current.length > 0 && !finalBufferRef.current.endsWith(" ");
            finalBufferRef.current += (needsSpace ? " " : "") + t.trim();
          } else {
            interim += t + " ";
          }
        }
        // Emit combined text instantly for live feel
        const combined = (finalBufferRef.current + " " + interim).trim();
        // Use rAF to make UI paint immediately on hot result streams
        window.requestAnimationFrame(() => onResult(combined));
      };

      rec.onerror = (ev: any) => {
        console.error("Speech recognition error:", ev.error);

        // Always consider recognition stopped at this point (prevents stuck states)
        setListening(false);

        // Handle specific error types
        switch (ev.error) {
          case "not-allowed":
          case "service-not-allowed":
          case "audio-capture":
            setSupported(false);
            break;
          case "no-speech":
          case "network":
          default:
            // Fast auto-restart for transient issues (if user still expects listening)
            if (!isStartingRef.current) {
              if (restartTimeout.current) {
                window.clearTimeout(restartTimeout.current);
              }
              restartTimeout.current = window.setTimeout(() => {
                restartTimeout.current = null;
                // Only restart if user hasn't toggled it off
                if (!listening) {
                  // attempt to start fresh
                  start().catch(() => {
                    setListening(false);
                  });
                }
              }, 50);
            }
        }
        isStartingRef.current = false;
      };

      rec.onend = () => {
        console.log("Speech recognition ended");
        // Immediate restart if we are still in listening mode expectation
        if (listening && !isStartingRef.current) {
          if (restartTimeout.current) {
            window.clearTimeout(restartTimeout.current);
          }
          restartTimeout.current = window.setTimeout(() => {
            restartTimeout.current = null;
            if (listening) {
              start().catch(() => {
                setListening(false);
              });
            }
          }, 50);
        }
      };

      // Optional: signal-level events can help certain browsers keep the session alive
      rec.onaudiostart = () => {
        // ensure UI stays responsive
        try { onResult((finalBufferRef.current || "").trim()); } catch {}
      };
      rec.onspeechstart = () => {
        try { onResult((finalBufferRef.current || "").trim()); } catch {}
      };

      // Start recognition
      rec.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setListening(false);
      setSupported(false);
      isStartingRef.current = false;
    }
  };

  const stop = () => {
    console.log("Stopping speech recognition");
    setListening(false);
    isStartingRef.current = false;
    // RESET buffer on stop too
    finalBufferRef.current = "";
    try { onResult(""); } catch {}

    if (restartTimeout.current) {
      window.clearTimeout(restartTimeout.current);
      restartTimeout.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null; // Prevent restart
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
        if (typeof recognitionRef.current.abort === "function") {
          recognitionRef.current.abort();
        }
      } catch (error) {
        console.warn("Error stopping speech recognition:", error);
      } finally {
        recognitionRef.current = null;
      }
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
          {/* Mobile-friendly, consistent tab list */}
          <TabsList className="flex overflow-x-auto max-w-full gap-1">
            <TabsTrigger value="drills">Q&A Drills</TabsTrigger>
            <TabsTrigger value="salary">Salary Coach</TabsTrigger>
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

        <TabsContent value="salary">
          <SalaryCoach
            jobDescription={jobDescription}
            resumeFileId={resumeFileId}
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
      // Pass resume for deeper tailoring
      const out = await genQs({ jd: jobDescription, count: 50, resumeFileId: resumeFileId as any });
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
  const [suggesting, setSuggesting] = useState(false);

  // NEW: session controls (updated durations + interview type)
  const [durationMin, setDurationMin] = useState<number>(30);
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [targetQuestions, setTargetQuestions] = useState<number>(0);
  const [questionsAsked, setQuestionsAsked] = useState<number>(0);
  const [metricsLog, setMetricsLog] = useState<Array<{ wpm: number; fillerPerMin: number; confidence: number }>>([]);
  const [sessionTranscript, setSessionTranscript] = useState<string>("");
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [interviewType, setInterviewType] = useState<"Intro" | "Technical" | "HR">("Intro");
  const [feedback, setFeedback] = useState<string>("");
  const [feedbackLoading, setFeedbackLoading] = useState<boolean>(false);
  const [sessionQuestions, setSessionQuestions] = useState<string[]>([]); // Add: store generated questions for the live session

  // derive questions target from duration (approx realistic pacing)
  const deriveTargetQuestions = (mins: number) => {
    if (mins <= 30) return 10;
    if (mins <= 60) return 18;
    return 25;
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
  const genQs = useAction(api.aiInterview.generateQuestions);
  const sessionFeedback = useAction(api.aiInterview.sessionFeedback);
  const transcribeChunk = useAction(api.aiInterview.transcribeChunk);

  // Small helper: retry wrapper for transient network issues
  const withRetry = async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e: any) {
      const msg = String(e?.message || "");
      const transient =
        msg.includes("Connection lost while action was in flight") ||
        msg.includes("network") ||
        msg.includes("fetch") ||
        msg.includes("timeout");
      if (transient) {
        // single retry
        return await fn();
      }
      throw e;
    }
  };

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
    try {
      // Generate tailored set using interviewType + resume
      const out = await genQs({ jd: jobDescription, count: target, interviewType, resumeFileId: resumeFileId as any });
      if (out && out.length) {
        setSessionQuestions(out); // Add: persist questions for this session
        setQuestion(out[0]);
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
    setFeedback("");
    setFeedbackLoading(false);
    // start timer
    setRemainingSec(durationMin * 60);
    setSessionActive(true);
    toast.success("Live interview started");
  };

  // End session and compute summary + AI feedback
  const endSession = () => {
    if (transcript.trim().length) {
      setSessionTranscript((prev) => `${prev} ${transcript}`.trim());
      setMetricsLog((prev) => [...prev, metrics]);
    }
    setSessionActive(false);
    setShowSummary(true);
    if (listening) {
      try { stop(); } catch {}
    }
    // Kick off feedback generation
    void generateFeedback();
  };

  const generateFeedback = async () => {
    if (!sessionTranscript.trim().length && !transcript.trim().length) return;
    try {
      setFeedbackLoading(true);
      const combined = `${sessionTranscript} ${transcript}`.trim();
      const out = await sessionFeedback({
        transcript: combined.slice(0, 12000),
        jd: jobDescription,
        interviewType,
      });
      setFeedback(out || "");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate feedback");
    } finally {
      setFeedbackLoading(false);
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

    if (transcript.trim().length) {
      setSessionTranscript((prev) => `${prev} ${transcript}`.trim());
      setMetricsLog((prev) => [...prev, metrics]);
    }
    setQuestionsAsked((n) => n + 1);

    if (questionsAsked + 1 >= targetQuestions) {
      endSession();
      return;
    }

    // Choose next question from sessionQuestions first, then fallback to sharedQuestions
    const pool = sessionQuestions.length ? sessionQuestions : (sharedQuestions || []);
    if (pool.length > 0) {
      // Try to pick a different question than current
      const attempts = Math.min(pool.length, 5);
      let next = pool[Math.floor(Math.random() * pool.length)];
      for (let i = 0; i < attempts && next === question && pool.length > 1; i++) {
        next = pool[Math.floor(Math.random() * pool.length)];
      }
      setQuestion(next);
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
      const q = await followUp({
        previousQuestion: question,
        userAnswer: answer,
        jd: jobDescription,
        interviewType,
      });
      setQuestion(q || "Can you go deeper on the impact and tradeoffs?");
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
      setSuggesting(true);
      const out = await withRetry(() =>
        suggest({
          question,
          jd: jobDescription,
          resumeFileId: resumeFileId as any,
          interviewType,
        })
      );
      setFinalAnswer(out);
      toast.success("Suggested answer generated");
    } catch (e: any) {
      toast.error(e?.message ? `Failed: ${e.message}` : "Failed to suggest answer");
    } finally {
      setSuggesting(false);
    }
  };

  const resetRecording = () => {
    setTranscript("");
    setStartedAt(null);
    setFinalAnswer("");
    setPolished("");
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

  // Add: Groq STT mode toggle and recorder refs
  const [useGroqSTT, setUseGroqSTT] = useState<boolean>(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const sendingRef = useRef<boolean>(false);
  const stoppedRef = useRef<boolean>(true);

  // Start Groq STT recorder
  const startGroq = async () => {
    try {
      if (recorderRef.current || !stoppedRef.current) return;
      // request mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Prefer opus/webm for smaller chunks and speed
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const rec = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = rec;
      stoppedRef.current = false;

      // Clear state and start timer
      setTranscript("");
      setStartedAt(Date.now());

      rec.ondataavailable = async (ev: BlobEvent) => {
        if (stoppedRef.current) return;
        const blob = ev.data;
        if (!blob || blob.size === 0) return;

        // Avoid overlapping sends
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
            // Append space if needed
            setTranscript((prev) => (prev && !prev.endsWith(" ") ? prev + " " + text : (prev || "") + text));
          }
        } catch {
          // swallow transient errors; chunks are continuous
        } finally {
          sendingRef.current = false;
        }
      };

      rec.onerror = () => {
        // Failover to Web Speech if available
        toast.error("Microphone recording error. Falling back to browser voice.");
        stopGroq();
        if (!supported) return;
        void start();
      };

      // Fire frequent chunks for near-instant text
      rec.start(500);
    } catch (e: any) {
      toast.error(e?.message || "Failed to start Groq voice");
      stopGroq();
    }
  };

  // Stop Groq STT recorder
  const stopGroq = () => {
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

  // Integrate start/stop unified
  const startUnified = () => {
    if (useGroqSTT) {
      // Ensure browser SR isn't running
      if (listening) {
        try { stop(); } catch {}
      }
      startGroq();
    } else {
      // Ensure Groq isn't running
      stopGroq();
      start();
    }
  };
  const stopUnified = () => {
    if (useGroqSTT) {
      stopGroq();
    } else {
      stop();
    }
  };

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      stopGroq();
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Live Interview Practice</CardTitle>
        <CardDescription className="text-sm">
          Timed, realistic interview. Choose a duration and round type; questions and follow-ups adapt to your JD and resume.
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
                  className={`px-3 py-1.5 text-xs ${durationMin === 30 ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setDurationMin(30)}
                >
                  30m
                </button>
                <button
                  className={`px-3 py-1.5 text-xs border-l ${durationMin === 60 ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setDurationMin(60)}
                >
                  60m
                </button>
                <button
                  className={`px-3 py-1.5 text-xs border-l ${durationMin === 90 ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setDurationMin(90)}
                >
                  90m
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Round:</span>
              <div className="flex rounded-md border overflow-hidden">
                <button
                  className={`px-3 py-1.5 text-xs ${interviewType === "Intro" ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setInterviewType("Intro")}
                >
                  Intro
                </button>
                <button
                  className={`px-3 py-1.5 text-xs border-l ${interviewType === "Technical" ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setInterviewType("Technical")}
                >
                  Technical
                </button>
                <button
                  className={`px-3 py-1.5 text-xs border-l ${interviewType === "HR" ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setInterviewType("HR")}
                >
                  HR
                </button>
              </div>
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
              <div className="text-muted-foreground">•</div>
              <div>
                Round: <span className="font-semibold">{interviewType}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={endSession}>End Session</Button>
            </div>
          </div>
        )}

        {/* Summary */}
        {showSummary && (
          <div className="rounded-lg border p-3 space-y-3">
            <div className="text-sm font-semibold">Session Summary</div>
            {summary && (
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
            )}
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
          {/* Add: STT mode toggle */}
          <div className="flex items-center gap-2 text-xs rounded-md border px-2 py-1">
            <span className="text-muted-foreground">STT:</span>
            <button
              className={`px-2 py-0.5 rounded ${useGroqSTT ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              onClick={() => {
                // switching modes stops current engine
                stopUnified();
                setUseGroqSTT((v) => !v);
                setTranscript("");
                setStartedAt(null);
              }}
            >
              {useGroqSTT ? "Groq (fast)" : "Browser"}
            </button>
          </div>

          {!supported && !useGroqSTT && (
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded px-2 py-1">
              Browser voice not supported. Switch to Groq (fast).
            </div>
          )}
          <Button
            size="sm"
            onClick={() => (useGroqSTT ? (stoppedRef.current ? startUnified() : stopUnified()) : listening ? stopUnified() : startUnified())}
            variant={useGroqSTT ? (stoppedRef.current ? "default" : "destructive") : listening ? "destructive" : "default"}
          >
            {useGroqSTT ? (stoppedRef.current ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />) : listening ? (
              <MicOff className="h-4 w-4 mr-2" />
            ) : (
              <Mic className="h-4 w-4 mr-2" />
            )}
            {useGroqSTT ? (stoppedRef.current ? "Start" : "Stop") : listening ? "Stop" : "Start"} Recording
          </Button>
          <Button size="sm" variant="outline" onClick={resetRecording}>
            Reset
          </Button>
          {(!stoppedRef.current && useGroqSTT) || listening ? (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Listening...
            </div>
          ) : null}
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
          <Button size="sm" variant="outline" onClick={handleSuggest} disabled={suggesting}>
            {suggesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
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

function SalaryCoach({
  jobDescription,
  resumeFileId,
}: {
  jobDescription?: string;
  resumeFileId?: string;
}) {
  const runCoach = useAction(api.aiInterview.salaryCoach);

  const [roleTitle, setRoleTitle] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [experienceYears, setExperienceYears] = useState<number | undefined>(undefined);
  const [currentBase, setCurrentBase] = useState<number | undefined>(undefined);
  const [currentBonus, setCurrentBonus] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    marketBands: Array<{ label: string; base: string; tc: string; note?: string }>;
    scripts: { initialReachout: string; postOfferNegotiation: string; competingOfferLeverage: string };
    tips: string[];
  } | null>(null);

  const analyze = async () => {
    if (!jobDescription) {
      toast.error("Provide or select a job description first in setup.");
      return;
    }
    try {
      setLoading(true);
      const out = await runCoach({
        jd: jobDescription,
        resumeFileId: (resumeFileId as any) || undefined,
        roleTitle: roleTitle || undefined,
        location: location || undefined,
        experienceYears: typeof experienceYears === "number" ? experienceYears : undefined,
        currentBase: typeof currentBase === "number" ? currentBase : undefined,
        currentBonus: typeof currentBonus === "number" ? currentBonus : undefined,
      });
      setResult(out as any);
      toast.success("Salary intel generated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate salary intel");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Salary Negotiation Coach</CardTitle>
        <CardDescription className="text-sm">
          Market bands and ready-to-use scripts tailored to your resume and JD. Powered by Groq.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="Target role (e.g., Frontend Engineer)"
          />
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (e.g., Bangalore, Remote)"
          />
          <Input
            value={experienceYears ?? ""}
            onChange={(e) => setExperienceYears(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Years of experience"
            type="number"
            min={0}
          />
          <Input
            value={currentBase ?? ""}
            onChange={(e) => setCurrentBase(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Current base (₹)"
            type="number"
            min={0}
          />
          <Input
            value={currentBonus ?? ""}
            onChange={(e) => setCurrentBonus(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Current bonus/sign-on (₹)"
            type="number"
            min={0}
          />
          <div className="flex items-center">
            <Button size="sm" onClick={analyze} disabled={loading || !jobDescription}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Analyze
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-4">
            <div>
              <SectionHeader title="Market Bands" description="Estimated ranges based on role, location, and background." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.marketBands?.map((band, i) => (
                  <div key={i} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{band.label}</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyText(`${band.label}: Base ${band.base}, TC ${band.tc}. ${band.note || ""}`.trim(), "Copied band")}
                      >
                        <Clipboard className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Base: {band.base}</div>
                    <div className="text-xs text-muted-foreground">Total Comp: {band.tc}</div>
                    {band.note && <div className="mt-1 text-xs">{band.note}</div>}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">Initial outreach</Badge>
                  <Button variant="outline" size="sm" onClick={() => copyText(result.scripts.initialReachout, "Copied script")}>
                    <Clipboard className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <div className="text-sm whitespace-pre-wrap">{result.scripts.initialReachout}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">Post-offer negotiation</Badge>
                  <Button variant="outline" size="sm" onClick={() => copyText(result.scripts.postOfferNegotiation, "Copied script")}>
                    <Clipboard className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <div className="text-sm whitespace-pre-wrap">{result.scripts.postOfferNegotiation}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">Competing offer leverage</Badge>
                  <Button variant="outline" size="sm" onClick={() => copyText(result.scripts.competingOfferLeverage, "Copied script")}>
                    <Clipboard className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <div className="text-sm whitespace-pre-wrap">{result.scripts.competingOfferLeverage}</div>
              </div>
            </div>

            <Separator />

            <div>
              <SectionHeader title="Tips" description="Crisp pointers to negotiate confidently." />
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {result.tips?.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}