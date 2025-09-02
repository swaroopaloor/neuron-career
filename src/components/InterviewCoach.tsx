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

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        setSupported(true);
        const rec = new SpeechRecognition() as RecognitionType;
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        rec.onresult = (e: any) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            interim += e.results[i][0].transcript;
          }
          onResult(interim);
        };
        rec.onerror = () => {
          // Gracefully disable voice mode and fall back to typing
          setListening(false);
          setSupported(false);
        };
        rec.onend = () => {
          setListening(false);
        };
        recognitionRef.current = rec;
      } catch {
        // If instantiation fails, mark as unsupported
        setSupported(false);
      }
    }
  }, [onResult]);

  const start = () => {
    if (!supported || !recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      // If start fails, disable voice mode
      setListening(false);
      setSupported(false);
    }
  };
  const stop = () => {
    if (!supported || !recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
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

export default function InterviewCoach({ jobDescription }: { jobDescription?: string }) {
  const [tab, setTab] = useState<"voice" | "ama">("voice");

  return (
    <div className="space-y-4">
      {jobDescription && (
        <div className="rounded-md border p-3 text-xs text-muted-foreground">
          Using selected analysis job description for AMA and polishing.
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={tab === "voice" ? "default" : "outline"}
          onClick={() => setTab("voice")}
        >
          <Volume2 className="h-4 w-4 mr-2" />
          Voice Mirror
        </Button>
        <Button
          size="sm"
          variant={tab === "ama" ? "default" : "outline"}
          onClick={() => setTab("ama")}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Ask Me Anything
        </Button>
      </div>

      {tab === "voice" ? <VoiceMirror jobDescription={jobDescription} /> : <AskMeAnything initialJd={jobDescription} jdLocked={!!jobDescription} />}
    </div>
  );
}

function VoiceMirror({ jobDescription }: { jobDescription?: string }) {
  const [question, setQuestion] = useState<string>("Tell me about yourself.");
  const [transcript, setTranscript] = useState<string>("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finalAnswer, setFinalAnswer] = useState<string>("");
  const [polished, setPolished] = useState<string>("");
  const [polishing, setPolishing] = useState(false);

  const onResult = (partial: string) => {
    if (!startedAt) setStartedAt(Date.now());
    setTranscript(partial);
  };

  const { supported, listening, start, stop } = useSpeechRecognition(onResult);
  const metrics = useMemo(() => computeMetrics(transcript, startedAt), [transcript, startedAt]);

  const polish = useAction(api.aiInterview.polishAnswer);

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
    } catch (e) {
      toast.error("Failed to generate polished answer");
    } finally {
      setPolishing(false);
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
        <SectionHeader title="Question" />
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter the interview question"
        />
        <Separator />
        <SectionHeader title="Record or type your answer" description={supported ? "Use your mic or type below. Metrics update in real-time." : "Speech recognition not supported in this browser. Type your answer below."} />
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

function AskMeAnything({ initialJd, jdLocked }: { initialJd?: string; jdLocked?: boolean }) {
  const [jd, setJd] = useState<string>(initialJd || "");
  useEffect(() => {
    // keep in sync if parent changes jobDescription
    setJd(initialJd || "");
  }, [initialJd]);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);
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
    setCurrentIdx((i) => Math.min(i + 1, questions.length - 1));
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
      setQuestions((prev) => {
        const arr = [...prev];
        arr.splice(currentIdx + 1, 0, q);
        return arr;
      });
      setCurrentIdx((i) => i + 1);
      setAnswer("");
      setPolished("");
      toast.success("Follow-up added");
    } catch (e) {
      toast.error("Failed to generate follow-up");
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
    } catch (e) {
      toast.error("Failed to polish answer");
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

        {sessionStarted && (
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
                  <Button size="sm" variant="outline" onClick={handleFollowUp} disabled={loading || !answer.trim()}>
                    Ask Follow-up
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button size="sm" onClick={handlePolish} disabled={loading || !answer.trim()}>
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
                onClick={() => setCurrentIdx((i) => Math.max(i - 1, 0))}
                disabled={currentIdx <= 0}
              >
                Prev
              </Button>
              <Button size="sm" onClick={handleNext} disabled={currentIdx >= questions.length - 1}>
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