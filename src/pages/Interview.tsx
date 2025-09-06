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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Loader2, 
  Video, 
  MessageSquare, 
  Brain, 
  Target, 
  Clock, 
  Star,
  Play,
  Pause,
  Square,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Users,
  BookOpen,
  Zap,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import InterviewCoach from "@/components/InterviewCoach";
import InterviewLiveCall from "@/components/InterviewLiveCall";

export default function InterviewPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"practice" | "live" | "coach">("practice");
  
  // Practice interview state
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceForm, setPracticeForm] = useState({
    jobTitle: "",
    company: "",
    interviewType: "behavioral",
    difficulty: "medium",
    duration: "30"
  });

  // Mock data and mutations
  const interviews: any[] = [];
  // startPracticeInterview deprecated - removed
  const generateQuestionsAction = useAction(api.aiInterview.generateQuestions);

  if (!isAuthenticated) {
    return (
      <div className="container-responsive py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Please sign in to access the Interview Suite.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const handleStartPractice = async () => {
    if (!practiceForm.jobTitle || !practiceForm.company) {
      toast("Please fill in job title and company");
      return;
    }

    try {
      setPracticeLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Practice interview started (simulated)

      toast("Practice interview started successfully!");
      
    } catch (error: any) {
      toast(error?.message || "Failed to start practice interview");
    } finally {
      setPracticeLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      const questions = await generateQuestionsAction({
        jd: `${practiceForm.jobTitle || "Software Engineer"} at ${practiceForm.company || "Tech Company"}`,
        interviewType: practiceForm.interviewType,
        count: 5
      });

      toast(`Generated ${questions?.length || 0} questions`);
      
    } catch (error: any) {
      toast(error?.message || "Failed to generate questions");
    } finally {
    }
  };

  return (
    <div className="container-responsive py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-8 w-8 text-primary" />
            Interview Suite
          </h1>
          <p className="text-muted-foreground">
            Practice interviews, get AI coaching, and conduct live sessions
          </p>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "practice", label: "Practice Interview", icon: Target },
                { id: "live", label: "Live Interview", icon: Video },
                { id: "coach", label: "AI Coach", icon: Brain }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex items-center gap-2"
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "practice" && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Practice Interview Setup
                </CardTitle>
                <CardDescription>
                  Configure your practice session parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Job Title</Label>
                    <Input
                      placeholder="e.g., Senior Software Engineer"
                      value={practiceForm.jobTitle}
                      onChange={(e) => setPracticeForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Company</Label>
                    <Input
                      placeholder="e.g., Google, Microsoft"
                      value={practiceForm.company}
                      onChange={(e) => setPracticeForm(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Interview Type</Label>
                    <Select 
                      value={practiceForm.interviewType} 
                      onValueChange={(value) => setPracticeForm(prev => ({ ...prev, interviewType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="behavioral">Behavioral</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="system-design">System Design</SelectItem>
                        <SelectItem value="case-study">Case Study</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <Select 
                      value={practiceForm.difficulty} 
                      onValueChange={(value) => setPracticeForm(prev => ({ ...prev, difficulty: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleStartPractice}
                    disabled={practiceLoading}
                    className="flex items-center gap-2"
                  >
                    {practiceLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Start Practice
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleGenerateQuestions}
                    className="flex items-center gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Generate Questions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Practice Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Practice Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {interviews.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No practice sessions yet</p>
                    <p className="text-sm text-muted-foreground">Start your first practice interview above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interviews.slice(0, 3).map((interview: any, index: number) => (
                      <motion.div
                        key={interview._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <div className="font-medium">{interview.jobTitle} at {interview.company}</div>
                          <div className="text-sm text-muted-foreground">
                            {interview.interviewType} • {new Date(interview._creationTime).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {interview.status || "Completed"}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "live" && (
          <motion.div
            key="live"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <InterviewLiveCall />
          </motion.div>
        )}

        {activeTab === "coach" && (
          <motion.div
            key="coach"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <InterviewCoach />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}