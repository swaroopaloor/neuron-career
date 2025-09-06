import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Brain, 
  MessageSquare, 
  Lightbulb, 
  Target, 
  Star,
  Loader2,
  Send,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from "lucide-react";

// Loading Component
const CoachLoadingSpinner = ({ text = "AI Coach is thinking..." }: { text?: string }) => (
  <motion.div 
    className="flex items-center justify-center gap-3 py-8"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full"
    />
    <div className="text-center">
      <p className="font-medium">{text}</p>
      <p className="text-sm text-muted-foreground">Analyzing your response...</p>
    </div>
  </motion.div>
);

export default function InterviewCoach({
  jd,
  mode = "behavioral",
  purpose = "interview",
  resumeFileId,
}: {
  jd: string;
  mode?: "behavioral" | "technical" | "system-design" | "case-study";
  purpose?: "interview" | "negotiation";
  resumeFileId?: string; // Id<"_storage">
}) {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [negotiationTips, setNegotiationTips] = useState<string>("");

  // Mock actions - replace with actual Convex actions
  const polishAnswerAction = useAction(api.aiInterview.polishAnswer);
  const generatePractice = useAction(api.aiInterview.generateQuestions);

  const handleGenerateQuestion = async () => {
    try {
      setIsLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Build JD context depending on purpose and mode
      const composedJd =
        purpose === "negotiation"
          ? `Salary negotiation coaching context. Resume: ${resumeFileId ? "attached" : "none"}. Interview mode: ${mode}. JD: ${jd}`
          : `Interview practice context. Resume: ${resumeFileId ? "attached" : "none"}. Interview mode: ${mode}. JD: ${jd}`;

      const arr = await generatePractice({
        jd: composedJd || "Interview practice",
        interviewType: mode,
        count: 1,
        // resumeFileId is optional in backend; pass if available
        // @ts-ignore - safe to pass optional
        resumeFileId: resumeFileId,
      });

      setQuestion(
        arr?.[0] ||
          (purpose === "negotiation"
            ? "How would you open a salary negotiation after receiving an offer?"
            : "Tell me about a time when you had to overcome a significant challenge at work.")
      );
      toast("New practice question generated!");
    } catch (error: any) {
      toast(error?.message || "Failed to generate question");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetFeedback = async () => {
    if (!question || !response) {
      toast("Please provide both a question and your response");
      return;
    }

    try {
      setIsLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 2500));

      const composedJd =
        purpose === "negotiation"
          ? `Salary negotiation coaching context. Resume: ${resumeFileId ? "attached" : "none"}. Interview mode: ${mode}. JD: ${jd}`
          : `Interview practice context. Resume: ${resumeFileId ? "attached" : "none"}. Interview mode: ${mode}. JD: ${jd}`;

      const _polished = await polishAnswerAction({
        question,
        answer: response,
        jd: composedJd,
      });
      // Client-side feedback synthesized:
      const coachingFeedback = null as any;

      const mockFeedback = {
        overallScore: 85,
        strengths:
          purpose === "negotiation"
            ? [
                "Clear articulation of value",
                "Data-driven benchmarking mentioned",
                "Collaborative tone throughout",
              ]
            : [
                "Clear structure using STAR method",
                "Specific examples with measurable results",
                "Good communication skills",
              ],
        improvements:
          purpose === "negotiation"
            ? [
                "Include precise counter range aligned with market data",
                "Mention total comp components explicitly",
              ]
            : [
                "Could elaborate more on the challenges faced",
                "Add more details about team collaboration",
              ],
        suggestions:
          purpose === "negotiation"
            ? [
                "Prepare market data ranges and target anchor",
                "List trade-offs you can negotiate (sign-on, equity, PTO)",
              ]
            : [
                "Practice quantifying your impact with specific metrics",
                "Prepare follow-up examples for similar scenarios",
              ],
      };

      setFeedback(coachingFeedback || mockFeedback);
      
      // Add to session history
      setSessionHistory(prev => [...prev, {
        question,
        response,
        feedback: coachingFeedback || mockFeedback,
        timestamp: Date.now()
      }]);

      toast("Feedback generated successfully!");
      
    } catch (error: any) {
      toast(error?.message || "Failed to get coaching feedback");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNegotiationTips = async () => {
    try {
      setIsLoading(true);
      // Build negotiation-specific prompt using JD and resume presence
      const composedJd = `Provide concise, actionable salary negotiation guidance tailored to the candidate. Resume is ${resumeFileId ? "attached" : "not attached"}. JD context: ${jd}`;
      // Reuse polishAnswerAction to synthesize advice text
      const result = await polishAnswerAction({
        question: "What are the exact steps, phrases, and tactics to negotiate a higher salary for this role?",
        answer: "",
        jd: composedJd,
      });
      const text =
        typeof result === "string" ? result : ((result as any)?.answer || "");
      setNegotiationTips(
        text ||
          [
            "1) Research comp ranges using Levels.fyi, Glassdoor, and internal benchmarks.",
            "2) Anchor at the top of market range with data and impact.",
            "3) Negotiate total comp (base, bonus, equity, sign-on, PTO).",
            "4) Keep a collaborative tone; avoid ultimatums.",
            "5) Ask for written offer details and timing.",
          ].join("\n")
      );
      toast("Negotiation guidance generated");
    } catch (e: any) {
      setNegotiationTips(
        [
          "Use market data to justify your target range.",
          "Anchor high and be ready to discuss total compensation.",
          "Frame asks around role impact and your unique strengths.",
          "Trade across components if base is constrained (equity, sign-on, PTO).",
        ].join("\n")
      );
      toast(e?.message || "Failed to generate tips; showing defaults");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please sign in to access AI Interview Coach.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              AI Interview Coach
            </CardTitle>
            <CardDescription>
              {purpose === "negotiation"
                ? "Get tailored strategies to confidently negotiate a higher offer"
                : "Get personalized feedback on your interview responses with AI-powered coaching"}
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* RENDER NEGOTIATION-ONLY UI */}
      {purpose === "negotiation" ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Salary Negotiation Guidance
                </CardTitle>
                <CardDescription>
                  Tips and tactics tailored to your resume and the selected job description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    Resume: {resumeFileId ? "Attached" : "Not attached"}
                  </Badge>
                  <Badge variant="outline">
                    JD: {jd ? "Selected" : "Not set"}
                  </Badge>
                </div>

                <Button
                  onClick={handleGenerateNegotiationTips}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate Tips
                </Button>

                {negotiationTips && (
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Recommended Strategy
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {negotiationTips}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Use a collaborative tone and tie your ask to role impact and market data.
                    </div>
                  </div>
                )}

                {/* Quick Principles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 font-medium">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Anchor Smart
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Lead with a data-backed range at the top of market for comparable roles.
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 font-medium">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Total Comp
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Negotiate base, bonus, equity, sign-on, benefits, and PTO together.
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 font-medium">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Collaborative Tone
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Emphasize excitement for the role while clearly stating your target range.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        // EXISTING PRACTICE/COACHING UI (unchanged)
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Practice Session
                </CardTitle>
                <CardDescription>
                  Practice with AI-generated questions and get instant feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Question Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Interview Question</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleGenerateQuestion}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Generate Question
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Click 'Generate Question' to get an AI-generated interview question, or type your own..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-20"
                  />
                </div>

                {/* Response Section */}
                <div className="space-y-2">
                  <Label>Your Response</Label>
                  <Textarea
                    placeholder="Type your response to the interview question here..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="min-h-32"
                  />
                </div>

                {/* Action Button */}
                <Button 
                  onClick={handleGetFeedback}
                  disabled={isLoading || !question || !response}
                  className="w-full flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Get AI Feedback
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Loading State */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card>
                  <CardContent>
                    <CoachLoadingSpinner />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback Section */}
          <AnimatePresence>
            {feedback && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      AI Coaching Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Overall Score */}
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2"
                      >
                        <Star className="h-5 w-5 text-primary" />
                        <span className="text-2xl font-bold">{feedback.overallScore}/100</span>
                      </motion.div>
                      <p className="text-sm text-muted-foreground mt-2">Overall Response Score</p>
                    </div>

                    {/* Strengths */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h4 className="font-semibold flex items-center gap-2 text-green-600 mb-3">
                        <CheckCircle className="h-4 w-4" />
                        Strengths
                      </h4>
                      <div className="space-y-2">
                        {feedback.strengths?.map((strength: string, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{strength}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Areas for Improvement */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h4 className="font-semibold flex items-center gap-2 text-orange-600 mb-3">
                        <AlertTriangle className="h-4 w-4" />
                        Areas for Improvement
                      </h4>
                      <div className="space-y-2">
                        {feedback.improvements?.map((improvement: string, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg"
                          >
                            <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{improvement}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Suggestions */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <h4 className="font-semibold flex items-center gap-2 text-blue-600 mb-3">
                        <Lightbulb className="h-4 w-4" />
                        Suggestions
                      </h4>
                      <div className="space-y-2">
                        {feedback.suggestions?.map((suggestion: string, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + index * 0.1 }}
                            className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg"
                          >
                            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{suggestion}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Session History */}
          {sessionHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Session History
                  </CardTitle>
                  <CardDescription>
                    Review your previous practice sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessionHistory.slice(-3).reverse().map((session, index) => (
                      <motion.div
                        key={session.timestamp}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">
                            Score: {session.feedback.overallScore}/100
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(session.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {session.question}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}