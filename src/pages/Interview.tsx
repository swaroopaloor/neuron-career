import { useState, useEffect } from "react";
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
  const savedSession = useQuery(api.users.getInterviewSession) as any;
  const saveInterviewSession = useMutation(api.users.saveInterviewSession);
  const userAnalyses = useQuery(api.analyses.getUserAnalyses, { limit: 10 }) ?? [];
  const userResumes = useQuery(api.resumes.listResumes) ?? [];

  const generateUploadUrl = useMutation(api.fileUpload.generateUploadUrl);

  // Add: hook for generating practice questions
  const generateQuestionsAction = useAction(api.aiInterview.generateQuestions);

  // Add: action to generate suggested answers
  const polishAnswerAction = useAction(api.aiInterview.polishAnswer);

  // Add: practice UI + control state
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceForm, setPracticeForm] = useState({
    jobTitle: "",
    company: "",
    interviewType: "behavioral",
    difficulty: "easy",
  });

  // Add: practice Q&A state (questions + AI-suggested answers shown one by one)
  const [qa, setQa] = useState<Array<{ q: string; a: string }>>([]);
  const [qaIdx, setQaIdx] = useState(0);
  const [qaLoading, setQaLoading] = useState(false);

  // Add: Motivational carousel content and state
  const MOTIVATION: Array<{ title: string; body: string }> = [
    { title: "Own your story", body: "Lead with measurable impact and finish with a confident ask." },
    { title: "Practice = poise", body: "Rehearse with intent, pause with purpose, and connect with clarity." },
    { title: "Show your edge", body: "Tie your strengths to their roadmap and solve real problems out loud." },
    { title: "Negotiate well", body: "Anchor with data, stay collaborative, and trade across components." },
  ];
  const [motIdx, setMotIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setMotIdx((i) => (i + 1) % MOTIVATION.length);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  // Add: practice UI + control state
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

  const [hydratedFromSession, setHydratedFromSession] = useState(false);

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
    // Require a resume for persistence (either saved or uploaded)
    if (!resolvedResumeId) {
      toast("Please select a resume (saved or upload a new one)");
      return;
    }
    setShowSetupDialog(false);
    // Persist selection so the user can resume later
    try {
      // @ts-ignore Convex expects Id<_storage> for resumeFileId
      saveInterviewSession({
        jd: resolvedJd,
        resumeFileId: resolvedResumeId,
        resumeFileName: resolvedResumeName || undefined,
        questions: [],
        currentIdx: 0,
      });
      toast("Configuration saved");
    } catch (e: any) {
      toast(e?.message || "Failed to save configuration");
    }
  };

  // Add: reconfigure to reopen dialog
  const handleReconfigure = () => {
    setShowSetupDialog(true);
  };

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

  const handleGenerateQA = async () => {
    if (!resolvedJd) {
      toast("Please select or paste a job description");
      return;
    }
    if (resumeChoice === "upload" && !resolvedResumeId) {
      toast("Please upload a resume or switch to saved resume");
      return;
    }

    try {
      setQaLoading(true);
      setQa([]);
      setQaIdx(0);

      const questions = await generateQuestionsAction({
        jd: `Mode: ${interviewMode}. ${resolvedJd}`,
        interviewType: practiceInterviewTypeMap[interviewMode],
        count: 50,
        // @ts-ignore optional
        resumeFileId: resolvedResumeId,
      });

      const qArr: string[] = Array.isArray(questions) ? questions : [];
      if (qArr.length === 0) {
        toast("No questions generated. Try switching the round or updating your JD.");
        return;
      }

      // Compose JD context for answer suggestions
      const composedJd = `Generate a concise, strong answer using STAR where relevant. Consider the user's resume ${resolvedResumeId ? "attached" : "not attached"} and JD: ${resolvedJd}`;

      // Sequentially generate suggested answers for each question
      const qaPairs: Array<{ q: string; a: string }> = [];
      for (let i = 0; i < qArr.length; i++) {
        const q = qArr[i];
        try {
          const suggested = await polishAnswerAction({
            question: q,
            // Seed an empty draft; backend should provide improved/polished suggestion
            answer: "",
            jd: composedJd,
          });
          const ans = typeof suggested === "string" ? suggested : ((suggested as any)?.answer || "");
          qaPairs.push({ q, a: ans });
        } catch {
          qaPairs.push({ q, a: "" });
        }
        // Update progressively so the user can start browsing as they generate
        if (i % 5 === 0) setQa([...qaPairs]);
      }

      setQa(qaPairs);
      setQaIdx(0);
      toast(`Generated ${qaPairs.length} Q&A items`);
    } catch (e: any) {
      toast(e?.message || "Failed to generate practice Q&A");
    } finally {
      setQaLoading(false);
    }
  };

  useEffect(() => {
    if (hydratedFromSession) return;
    if (!savedSession) return;
    // Prefer saved session JD
    if (typeof savedSession.jd === "string" && savedSession.jd.trim().length > 0) {
      setJdChoice("new");
      setJobDescription(savedSession.jd);
      setSelectedAnalysisId(undefined);
    }
    // Resume: if matches saved resume on profile, treat as "saved", else consider it "upload"
    if (savedSession.resumeFileId) {
      if (currentUser?.savedResumeId && currentUser.savedResumeId === savedSession.resumeFileId) {
        setResumeChoice("saved");
      } else {
        setResumeChoice("upload");
        setUploadedResumeId(savedSession.resumeFileId);
        setUploadedResumeName(savedSession.resumeFileName || "Uploaded Resume");
      }
    }
    // Close setup if we have both JD and a resume
    if ((savedSession.jd && savedSession.resumeFileId) || (currentUser?.savedResumeId && (savedSession.jd || resolvedJd))) {
      setShowSetupDialog(false);
    }
    setHydratedFromSession(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedSession, currentUser, hydratedFromSession]);

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

  return (
    <div className="container-responsive py-2 space-y-4">
      {/* Motivational Hero (animated) */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-lg p-3 md:p-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10 border shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary/70 animate-pulse" />
              Daily Momentum
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={motIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-1"
              >
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                  {MOTIVATION[motIdx].title}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  {MOTIVATION[motIdx].body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Momentum tiles */}
          <div className="grid grid-cols-3 gap-2 md:gap-3 w-full md:w-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-lg border bg-background/60 px-2.5 py-1.5"
            >
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Focus</div>
              <div className="text-sm font-medium">One strong story</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-lg border bg-background/60 px-2.5 py-1.5"
            >
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Practice</div>
              <div className="text-sm font-medium">2 short reps</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-lg border bg-background/60 px-2.5 py-1.5"
            >
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Progress</div>
              <div className="text-sm font-medium">+1 improvement</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

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
                        {(a.jobDescription || "").slice(0, 80) || "Job description"}{(a.jobDescription || "").length > 80 ? "..." : ""}
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
        <div className="w-full">
          <Card className="border bg-background/80 backdrop-blur-sm shadow-sm">
            <CardContent className="py-4 px-5">
              <div className="flex items-start gap-3">
                <Video className="h-7 w-7 mt-0.5 text-primary drop-shadow" />
                <div>
                  {/* Styled title */}
                  <div className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    Interview Suite
                  </div>
                  {/* Refined subtitle */}
                  <div className="text-sm md:text-base text-muted-foreground/90">
                    Practice questions, live mock interview, and salary negotiation coaching
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Compact Config Summary + Reconfigure */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
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
          <CardContent className="p-4">
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
                      Practice Questions
                    </CardTitle>
                    <CardDescription>
                      50 questions with suggested answers based on your resume and job description
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Round Toggle (Intro / Technical / HR) */}
                    <div className="space-y-2">
                      <Label>Interview Round</Label>
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

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleGenerateQA}
                        disabled={qaLoading}
                        className="flex items-center gap-2"
                      >
                        {qaLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        Generate 50 Q&A
                      </Button>
                    </div>

                    {/* Q&A Viewer */}
                    {qa.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Total: {qa.length}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {qaIdx + 1} / {qa.length}
                          </span>
                        </div>

                        <div className="p-4 border rounded-lg space-y-3">
                          <div className="text-sm font-medium">
                            Q{qaIdx + 1}: {qa[qaIdx]?.q}
                          </div>
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {qa[qaIdx]?.a ? (
                              qa[qaIdx].a
                            ) : (
                              "Generating suggested answer..."
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            onClick={() => setQaIdx((i) => Math.max(0, i - 1))}
                            disabled={qaIdx === 0}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setQaIdx((i) => Math.min(qa.length - 1, i + 1))}
                            disabled={qaIdx >= qa.length - 1}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
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