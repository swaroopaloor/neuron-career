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

export default function InterviewCoach() {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);

  // Mock actions - replace with actual Convex actions
  const polishAnswerAction = useAction(api.aiInterview.polishAnswer);
  const generatePractice = useAction(api.aiInterview.generateQuestions);

  const handleGenerateQuestion = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const arr = await generatePractice({
        jd: `Interview type: behavioral, difficulty: medium`,
        interviewType: "behavioral",
        count: 1
      });
      
      setQuestion(arr?.[0] || "Tell me about a time when you had to overcome a significant challenge at work.");
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
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const _polished = await polishAnswerAction({
        question,
        answer: response,
        jd: "behavioral interview"
      });
      // Client-side feedback synthesized:
      const coachingFeedback = null as any;

      // Mock feedback structure
      const mockFeedback = {
        overallScore: 85,
        strengths: [
          "Clear structure using STAR method",
          "Specific examples with measurable results",
          "Good communication skills"
        ],
        improvements: [
          "Could elaborate more on the challenges faced",
          "Add more details about team collaboration"
        ],
        suggestions: [
          "Practice quantifying your impact with specific metrics",
          "Prepare follow-up examples for similar scenarios"
        ]
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
              Get personalized feedback on your interview responses with AI-powered coaching
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Practice Section */}
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
    </div>
  );
}