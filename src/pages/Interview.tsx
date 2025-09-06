import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useAction } from "convex/react";
import { useQuery, useMutation } from "convex/react";
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
import { Upload, FileText, ListChecks } from "lucide-react";
import InterviewCoach from "@/components/InterviewCoach";
import InterviewLiveCall from "@/components/InterviewLiveCall";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function InterviewPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"practice" | "live" | "negotiation">("practice");

  // Add: show setup modal on first open until saved
  const [showSetupDialog, setShowSetupDialog] = useState(true);

  // Setup selections
  const currentUser = useQuery(api.users.currentUser) as any;
  const userAnalyses = useQuery(api.analyses.getUserAnalyses, { limit: 10 }) ?? [];
  const userResumes = useQuery(api.resumes.listResumes) ?? [];

  const generateUploadUrl = useMutation(api.fileUpload.generateUploadUrl);

  // Add: hook for generating practice questions
  const generateQuestionsAction = useAction(api.aiInterview.generateQuestions);

  // Add: practice UI + control state
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceForm, setPracticeForm] = useState({
    jobTitle: "",
    company: "",
    interviewType: "behavioral",
    difficulty: "easy",
  });

  // Remove inline setup section; we'll use modal & compact summary
  const [resumeChoice, setResumeChoice] = useState<"saved" | "upload">("saved");
  const [uploadedResumeId, setUploadedResumeId] = useState<string | undefined>(undefined);
  const [uploadedResumeName, setUploadedResumeName] = useState<string>("");

  const [jdChoice, setJdChoice] = useState<"existing" | "new">("existing");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | undefined>(undefined);
  const [jobDescription, setJobDescription] = useState<string>("");

  const [interviewMode, setInterviewMode] = useState<"intro" | "technical" | "hr">("intro");

  const resolvedResumeId = resumeChoice === "saved" ? currentUser?.savedResumeId : uploadedResumeId;
  const resolvedResumeName =
    resumeChoice === "saved"
      ? currentUser?.savedResumeName || (currentUser?.savedResumeId ? "Saved Resume" : "None")
      : uploadedResumeName || (uploadedResumeId ? "Uploaded Resume" : "None");

  const resolvedJd =
    jdChoice === "existing"
      ? (userAnalyses.find((a: any) => a._id === selectedAnalysisId)?.jobDescription || "")
      : jobDescription;

  const practiceInterviewTypeMap: Record<typeof interviewMode, string> = {
    intro: "behavioral",
    technical: "technical",
    hr: "behavioral",
  };

  async function handleUploadResume(file: File) {
    try {
      const url = await generateUploadUrl({});
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      const { storageId } = json;
      setUploadedResumeId(storageId);
      setUploadedResumeName(file.name);
      toast("Resume uploaded successfully");
    } catch (e: any) {
      toast(e?.message || "Failed to upload resume");
    }
  }

  // Add: Save config and close dialog
  const handleSaveConfiguration = () => {
    if (!resolvedJd) {
      toast("Please select or paste a job description");
      return;
    }
    if (resumeChoice === "upload" && !resolvedResumeId) {
      toast("Please upload a resume or switch to saved resume");
      return;
    }
    setShowSetupDialog(false);
    toast("Configuration saved");
  };

  // Add: reconfigure to reopen dialog
  const handleReconfigure = () => {
    setShowSetupDialog(true);
  };

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
    if (!resolvedJd) {
      toast("Please select or paste a job description");
      return;
    }
    if (!resolvedResumeId && resumeChoice === "upload") {
      toast("Please upload a resume or switch to saved resume");
      return;
    }
    try {
      setPracticeLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      toast("Practice session ready");
    } catch (error: any) {
      toast(error?.message || "Failed to start practice");
    } finally {
      setPracticeLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!resolvedJd) {
      toast("Please select or paste a job description");
      return;
    }
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const questions = await generateQuestionsAction({
        jd: `Mode: ${interviewMode}. ${resolvedJd}`,
        interviewType: practiceInterviewTypeMap[interviewMode],
        count: 5,
        // @ts-ignore pass optional resume id
        resumeFileId: resolvedResumeId,
      });
      toast(`Generated ${questions?.length || 0} questions`);
    } catch (error: any) {
      toast(error?.message || "Failed to generate questions");
    } finally {
    }
  };

  return (
    <div className="container-responsive py-8 space-y-8">
      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure your Interview Session</DialogTitle>
            <DialogDescription>
              Choose a resume and job description. You can reconfigure anytime.
            </DialogDescription>
          </DialogHeader>

          {/* Resume Choice */}
          <div className="space-y-2">
            <Label>Resume</Label>
            <RadioGroup
              className="flex flex-wrap gap-4"
              value={resumeChoice}
              onValueChange={(v) => setResumeChoice(v as any)}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="saved" id="dlg-resume-saved" />
                <Label htmlFor="dlg-resume-saved" className="cursor-pointer">
                  Use Saved Resume {currentUser?.savedResumeId ? `(${currentUser?.savedResumeName || "Saved"})` : "(None saved)"}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="upload" id="dlg-resume-upload" />
                <Label htmlFor="dlg-resume-upload" className="cursor-pointer">Upload New</Label>
              </div>
            </RadioGroup>
            {resumeChoice === "upload" && (
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadResume(f);
                  }}
                />
                <Badge variant="outline">
                  {uploadedResumeName ? `Selected: ${uploadedResumeName}` : "No file uploaded"}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* JD Choice */}
          <div className="space-y-2">
            <Label>Job Description</Label>
            <RadioGroup
              className="flex flex-wrap gap-4"
              value={jdChoice}
              onValueChange={(v) => setJdChoice(v as any)}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="existing" id="dlg-jd-existing" />
                <Label htmlFor="dlg-jd-existing" className="cursor-pointer">Use from Recent Analysis</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="new" id="dlg-jd-new" />
                <Label htmlFor="dlg-jd-new" className="cursor-pointer">Paste New</Label>
              </div>
            </RadioGroup>

            {jdChoice === "existing" ? (
              <div className="space-y-2">
                <Select value={selectedAnalysisId} onValueChange={setSelectedAnalysisId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an analysis" />
                  </SelectTrigger>
                  <SelectContent>
                    {userAnalyses.map((a: any) => (
                      <SelectItem key={a._id} value={a._id}>
                        {a.resumeFileName || "Resume"} • {new Date(a._creationTime).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAnalysisId && (
                  <div className="text-sm text-muted-foreground line-clamp-3">
                    {(userAnalyses.find((a: any) => a._id === selectedAnalysisId)?.jobDescription || "").slice(0, 400)}
                    {(userAnalyses.find((a: any) => a._id === selectedAnalysisId)?.jobDescription || "").length > 400 ? "..." : ""}
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-28"
              />
            )}
          </div>

          <Separator />

          {/* Mode */}
          <div className="space-y-2">
            <Label>Interview Mode</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "intro", label: "Intro Call" },
                { id: "technical", label: "Technical Round" },
                { id: "hr", label: "HR Round" },
              ].map((m) => (
                <Button
                  key={m.id}
                  variant={interviewMode === (m.id as any) ? "default" : "outline"}
                  onClick={() => setInterviewMode(m.id as any)}
                  className="h-9"
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSaveConfiguration}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            Practice questions, live mock interview, and salary negotiation coaching
          </p>
        </div>
      </motion.div>

      {/* Compact Config Summary + Reconfigure */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Resume: {resolvedResumeName}</Badge>
              <Badge variant="outline">JD: {resolvedJd ? "Selected" : "Not set"}</Badge>
              <Badge variant="outline" className="capitalize">Mode: {interviewMode}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSetupDialog(true)}>Reconfigure</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Toggles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "practice", label: "Practice Questions", icon: Target },
                { id: "live", label: "Live Interview", icon: Video },
                { id: "negotiation", label: "Salary Negotiation Coach", icon: Brain },
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
            {/* Guard */}
            {!resolvedJd || showSetupDialog ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Please configure your resume and job description.</p>
                  <Button onClick={() => setShowSetupDialog(true)}>Open Configuration</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Practice Questions Setup
                    </CardTitle>
                    <CardDescription>
                      Generate questions based on your configuration
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
                        Prepare Session
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
              </>
            )}
          </motion.div>
        )}

        {activeTab === "live" && (
          <motion.div
            key="live"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {!resolvedJd || showSetupDialog ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Please configure your resume and job description.</p>
                  <Button onClick={() => setShowSetupDialog(true)}>Open Configuration</Button>
                </CardContent>
              </Card>
            ) : (
              <InterviewLiveCall jd={resolvedJd} resumeFileId={resolvedResumeId} mode={interviewMode} />
            )}
          </motion.div>
        )}

        {activeTab === "negotiation" && (
          <motion.div
            key="negotiation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {!resolvedJd || showSetupDialog ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Please configure your resume and job description.</p>
                  <Button onClick={() => setShowSetupDialog(true)}>Open Configuration</Button>
                </CardContent>
              </Card>
            ) : (
              <InterviewCoach
                jd={resolvedJd}
                mode={practiceInterviewTypeMap[interviewMode] as any}
                purpose="negotiation"
                resumeFileId={resolvedResumeId}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}