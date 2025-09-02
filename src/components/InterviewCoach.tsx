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

export default function InterviewCoach({ jobDescription, resumeFileId }: { jobDescription?: string; resumeFileId?: string }) {
  // Share questions and current index across Voice Mirror and AMA
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);
  const [openItem, setOpenItem] = useState<string | undefined>("voice");

  return (
    <div className="space-y-4">
      {jobDescription && (
        <div className="rounded-md border p-3 text-xs text-muted-foreground">
          Using selected analysis job description for AMA and polishing.
        </div>
      )}

      <Accordion
        type="single"
        collapsible
        value={openItem}
        onValueChange={(v) => setOpenItem(v || undefined)}
        className="w-full"
      >
        <AccordionItem value="qa" className="border rounded-lg px-3">
          <AccordionTrigger className="text-base font-semibold py-3">Q&A Drills</AccordionTrigger>
          <AccordionContent>
            <QADrills
              jobDescription={jobDescription}
              resumeFileId={resumeFileId}
              sharedQuestions={questions}
              setSharedQuestions={setQuestions}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="voice" className="border rounded-lg px-3">
          <AccordionTrigger className="text-base font-semibold py-3">Voice Mirror</AccordionTrigger>
          <AccordionContent>
            <VoiceMirror
              jobDescription={jobDescription}
              resumeFileId={resumeFileId}
              sharedQuestions={questions}
              currentIdx={currentIdx}
              // Use numeric updates to avoid functional setter incompatibility
              onPrev={() => setCurrentIdx(Math.max(currentIdx - 1, 0))}
              onNext={() => setCurrentIdx(Math.min(currentIdx + 1, Math.max(questions.length - 1, 0)))}
              onJump={(idx) => setCurrentIdx(idx)}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ama" className="border rounded-lg px-3">
          <AccordionTrigger className="text-base font-semibold py-3">Ask Me Anything</AccordionTrigger>
          <AccordionContent>
            <AskMeAnything
              initialJd={jobDescription}
              jdLocked={!!jobDescription}
              externalQuestions={questions}
              setExternalQuestions={setQuestions}
              externalCurrentIdx={currentIdx}
              setExternalCurrentIdx={setCurrentIdx}
              onStartSession={() => { if (currentIdx === -1) setCurrentIdx(0); }}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
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

  // If shared questions provided, sync current question
  useEffect(() => {
    if (sharedQuestions && typeof currentIdx === "number" && currentIdx >= 0 && currentIdx < sharedQuestions.length) {
      setQuestion(sharedQuestions[currentIdx]);
    }
  }, [sharedQuestions, currentIdx]);

  const onResult = (partial: string) => {
    if (!startedAt) setStartedAt(Date.now());
    setTranscript(partial);
  };

  const { supported, listening, start, stop } = useSpeechRecognition(onResult);
  const metrics = useMemo(() => computeMetrics(transcript, startedAt), [transcript, startedAt]);

  const polish = useAction(api.aiInterview.polishAnswer);
  const suggest = useAction(api.aiInterview.suggestAnswer);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Voice Mirror</CardTitle>
        <CardDescription className="text-sm">
          Real-time filler counter, pacing, and confidence. Generate a polished answer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionHeader title="Question" description={sharedQuestions?.length ? "Using current question from 50 Questions" : undefined} />
        <div className="flex items-center gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter the interview question"
          />
          {typeof currentIdx === "number" && sharedQuestions && sharedQuestions.length > 0 && (
            <Badge variant="outline" className="whitespace-nowrap">
              {currentIdx + 1} / {sharedQuestions.length}
            </Badge>
          )}
        </div>

        {sharedQuestions && sharedQuestions.length > 0 && typeof currentIdx === "number" && (
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" onClick={onPrev} disabled={currentIdx <= 0}>
              Prev
            </Button>
            <div className="text-xs text-muted-foreground">
              Pick from the generated list below
            </div>
            <Button size="sm" onClick={onNext} disabled={currentIdx >= sharedQuestions.length - 1}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {sharedQuestions && sharedQuestions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {sharedQuestions.map((q, idx) => (
              <button
                key={`${idx}-${q.slice(0, 12)}`}
                onClick={() => onJump && onJump(idx)}
                className={`text-left rounded-md border p-2 text-xs hover:bg-secondary transition ${
                  typeof currentIdx === "number" && idx === currentIdx ? "border-primary" : "border-border"
                }`}
              >
                <span className="font-medium mr-1">{idx + 1}.</span>
                {q}
              </button>
            ))}
          </div>
        )}

        <Separator />
        <SectionHeader title="Record or type your answer" description="Use your mic or type. Metrics update in real-time." />
        <div className="flex items-center gap-2">
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

        <div className="flex items-center gap-2">
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

function AskMeAnything({
  initialJd,
  jdLocked,
  externalQuestions,
  setExternalQuestions,
  externalCurrentIdx,
  setExternalCurrentIdx,
  onStartSession,
}: {
  initialJd?: string;
  jdLocked?: boolean;
  externalQuestions?: string[];
  setExternalQuestions?: (qs: string[]) => void;
  externalCurrentIdx?: number;
  setExternalCurrentIdx?: (idx: number) => void;
  onStartSession?: () => void;
}) {
  const [jd, setJd] = useState<string>(initialJd || "");
  useEffect(() => { setJd(initialJd || ""); }, [initialJd]);
  const [loading, setLoading] = useState(false);

  // Use external or internal questions/index
  const [localQuestions, setLocalQuestions] = useState<string[]>([]);
  const [localIdx, setLocalIdx] = useState<number>(-1);

  const questions = externalQuestions ?? localQuestions;
  const setQuestions = setExternalQuestions ?? setLocalQuestions;
  const currentIdx = typeof externalCurrentIdx === "number" ? externalCurrentIdx : localIdx;
  const setCurrentIdx = setExternalCurrentIdx ?? setLocalIdx;

  const [answer, setAnswer] = useState<string>("");
  const [polished, setPolished] = useState<string>("");
  const [sessionStarted, setSessionStarted] = useState(false);

  const genQs = useAction(api.aiInterview.generateQuestions);
  const polish = useAction(api.aiInterview.polishAnswer);
  const followUp = useAction(api.aiInterview.nextFollowUp);

  const currentQuestion = currentIdx >= 0 && currentIdx < questions.length ? questions[currentIdx] : "";

  const handleGenerate = async () => {
    if (!jd.trim()) {
      toast.error("Paste a job description first");
      return;
    }
    try {
      setLoading(true);
      const out = await genQs({ jd, count: 50 });
      setQuestions(out);
      setCurrentIdx(0);
      setSessionStarted(true);
      onStartSession && onStartSession();
      toast.success("Generated 50 practice questions");
    } catch (e) {
      toast.error("Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    // Advance to next base question
    setPolished("");
    setAnswer("");
    setCurrentIdx(Math.min(currentIdx + 1, Math.max(questions.length - 1, 0)));
  };

  const handleFollowUp = async () => {
    if (!currentQuestion || !answer.trim()) {
      toast.error("Answer the current question first.");
      return;
    }
    try {
      setLoading(true);
      const q = await followUp({
        previousQuestion: currentQuestion,
        userAnswer: answer,
        jd,
      });
      const updated = [...questions];
      updated.splice(currentIdx + 1, 0, q);
      setQuestions(updated);
      setCurrentIdx(currentIdx + 1);
      setAnswer("");
      setPolished("");
      toast.success("Follow-up added");
    } catch (e: any) {
      toast.error(e?.message ? `Failed: ${e.message}` : "Failed to generate follow-up");
    } finally {
      setLoading(false);
    }
  };

  const handlePolish = async () => {
    if (!currentQuestion || !answer.trim()) {
      toast.error("Provide your answer first.");
      return;
    }
    try {
      setLoading(true);
      const out = await polish({ question: currentQuestion, answer, jd });
      setPolished(out);
      toast.success("Polished answer generated");
    } catch (e: any) {
      toast.error(e?.message ? `Failed: ${e.message}` : "Failed to polish answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ask Me Anything</CardTitle>
        <CardDescription className="text-sm">
          Paste a JD to generate 50 tailored questions. Get smart follow-ups and polished answers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionHeader title="Job Description" />
        <Textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the job description here..."
          className="min-h-32"
          disabled={jdLocked}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleGenerate} disabled={loading || (!jd.trim())}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate 50 Questions
          </Button>
          {sessionStarted && (
            <Badge variant="outline" className="text-xs">Session active</Badge>
          )}
        </div>

        {questions.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Current Question</div>
              <div className="text-xs text-muted-foreground">
                {currentIdx + 1} / {questions.length}
              </div>
            </div>
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border p-3 text-sm"
            >
              {currentQuestion}
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit">Your Answer</Badge>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="min-h-28"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={async () => {
                    if (!currentQuestion || !answer.trim()) { toast.error("Answer the current question first."); return; }
                    try {
                      setLoading(true);
                      const q = await followUp({ previousQuestion: currentQuestion, userAnswer: answer, jd });
                      const updated = [...questions];
                      updated.splice(currentIdx + 1, 0, q);
                      setQuestions(updated);
                      setCurrentIdx(currentIdx + 1);
                      setAnswer("");
                      setPolished("");
                      toast.success("Follow-up added");
                    } catch (e: any) {
                      toast.error(e?.message ? `Failed: ${e.message}` : "Failed to generate follow-up");
                    } finally {
                      setLoading(false);
                    }
                  }} disabled={loading || !answer.trim()}>
                    Ask Follow-up
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button size="sm" onClick={async () => {
                    if (!currentQuestion || !answer.trim()) { toast.error("Provide your answer first."); return; }
                    try {
                      setLoading(true);
                      const out = await polish({ question: currentQuestion, answer, jd });
                      setPolished(out);
                      toast.success("Polished answer generated");
                    } catch (e: any) {
                      toast.error(e?.message ? `Failed: ${e.message}` : "Failed to polish answer");
                    } finally {
                      setLoading(false);
                    }
                  }} disabled={loading || !answer.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Polish Answer
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Badge variant="outline" className="w-fit">Polished</Badge>
                <div className="rounded-lg border p-3 min-h-28 text-sm whitespace-pre-wrap">
                  {polished || <span className="text-muted-foreground">Polished answer will appear here.</span>}
                </div>
                {polished && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { navigator.clipboard.writeText(polished); toast.success("Copied"); }}
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentIdx(Math.max(currentIdx - 1, 0))}
                disabled={currentIdx <= 0}
              >
                Prev
              </Button>
              <Button size="sm" onClick={() => { setPolished(""); setAnswer(""); setCurrentIdx(Math.min(currentIdx + 1, questions.length - 1)); }} disabled={currentIdx >= questions.length - 1}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div>
              <SectionHeader title="All Questions" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                {questions.map((q, idx) => (
                  <button
                    key={`${idx}-${q.slice(0, 12)}`}
                    onClick={() => { setCurrentIdx(idx); setAnswer(""); setPolished(""); }}
                    className={`text-left rounded-md border p-2 text-xs hover:bg-secondary transition ${
                      idx === currentIdx ? "border-primary" : "border-border"
                    }`}
                  >
                    <span className="font-medium mr-1">{idx + 1}.</span>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}