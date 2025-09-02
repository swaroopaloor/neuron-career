import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import InterviewCoach from "@/components/InterviewCoach";
import { Sparkles } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, BookOpen, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Interview() {
  const { isLoading, isAuthenticated, user } = useAuth();

  // Selection state
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [newJobJd, setNewJobJd] = useState("");

  // Setup dialog state
  const [setupOpen, setSetupOpen] = useState<boolean>(true);
  const [resumeChoice, setResumeChoice] = useState<"saved" | "new" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sessionResumeFileId, setSessionResumeFileId] = useState<string | undefined>(undefined);
  const [sessionResumeName, setSessionResumeName] = useState<string | undefined>(undefined);

  // Load user's analyses (guarded; avoids throwing when not authenticated)
  const analyses = useQuery(api.analyses.getUserAnalyses, isAuthenticated ? { limit: 50 } : "skip");

  const selectedAnalysis = useMemo(() => {
    if (!analyses || !selectedAnalysisId) return null;
    return analyses.find((a: any) => a._id === selectedAnalysisId) || null;
  }, [analyses, selectedAnalysisId]);

  const effectiveJd = mode === "existing" ? (selectedAnalysis?.jobDescription || "") : newJobJd;

  // Mutations
  const generateUploadUrl = useMutation(api.fileUpload.generateUploadUrl);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    setFile(selectedFile);
    toast.success("Resume ready to upload");
  };

  const uploadNewResume = async (): Promise<{ storageId: string; name: string } | null> => {
    if (!file) return null;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, { method: "POST", body: file });
      if (!result.ok) throw new Error("Failed to upload file");
      const { storageId } = await result.json();
      return { storageId, name: file.name };
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const completeSetup = async () => {
    try {
      // Resolve resume
      let resumeId = sessionResumeFileId || user?.savedResumeId;
      let resumeName = sessionResumeName || user?.savedResumeName;

      if (resumeChoice === "new") {
        const uploaded = await uploadNewResume();
        if (!uploaded) return;
        resumeId = uploaded.storageId;
        resumeName = uploaded.name;
      } else if (resumeChoice === "saved") {
        if (!user?.savedResumeId) {
          toast.error("No saved resume found.");
          return;
        }
        resumeId = user.savedResumeId;
        resumeName = user.savedResumeName || "Saved Resume";
      } else {
        toast.error("Choose a resume source");
        return;
      }

      if (!resumeId) {
        toast.error("Resume is required");
        return;
      }

      if (!(effectiveJd && effectiveJd.trim().length > 0)) {
        toast.error("Provide a job description or select an analysis");
        return;
      }

      setSessionResumeFileId(resumeId);
      setSessionResumeName(resumeName);
      setSetupOpen(false);
      toast.success("Setup complete. Happy practicing!");
    } catch (e: any) {
      toast.error(e?.message || "Setup failed");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"
        />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={(o) => setSetupOpen(o)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Start Interview Practice
            </DialogTitle>
            <DialogDescription>
              Choose your resume and job description to tailor questions and answers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Resume source */}
            <div className="space-y-2">
              <Label className="font-medium">Choose Resume</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {user?.savedResumeId && (
                  <button
                    className={`border-2 border-dashed rounded-lg p-4 text-left transition ${
                      resumeChoice === "saved" ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50"
                    }`}
                    onClick={() => setResumeChoice("saved")}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-6 w-6 text-primary" />
                      <div>
                        <div className="font-medium">Use Saved Resume</div>
                        <div className="text-xs text-muted-foreground">
                          {user.savedResumeName || "Default Resume"}
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                <label
                  className={`border-2 border-dashed rounded-lg p-4 text-left cursor-pointer transition ${
                    resumeChoice === "new" ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Upload className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-medium">Upload New PDF</div>
                      <div className="text-xs text-muted-foreground">PDF up to 5MB</div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        handleFileSelect(f);
                        setResumeChoice("new");
                      }
                    }}
                  />
                </label>
              </div>
              {file && resumeChoice === "new" && (
                <div className="rounded-md border p-2 text-xs flex items-center gap-2">
                  <FileText className="h-4 w-4" /> {file.name}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => setFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* JD source */}
            <div className="space-y-2">
              <Label className="font-medium">Job Description</Label>
              <RadioGroup
                value={mode}
                onValueChange={(v: "existing" | "new") => setMode(v)}
                className="grid grid-cols-1 gap-3"
              >
                <Label
                  htmlFor="existing"
                  className={`border rounded-md p-3 cursor-pointer flex items-start gap-3 ${
                    mode === "existing" ? "border-primary" : ""
                  }`}
                >
                  <RadioGroupItem id="existing" value="existing" className="mt-0.5" />
                  <div>
                    <div className="font-medium">Use previous analysis</div>
                    <div className="text-xs text-muted-foreground">
                      Pick a past analysis JD
                    </div>
                  </div>
                </Label>

                <Label
                  htmlFor="new"
                  className={`border rounded-md p-3 cursor-pointer flex items-start gap-3 ${
                    mode === "new" ? "border-primary" : ""
                  }`}
                >
                  <RadioGroupItem id="new" value="new" className="mt-0.5" />
                  <div>
                    <div className="font-medium">Paste a new JD</div>
                    <div className="text-xs text-muted-foreground">
                      Tailor questions to a fresh role
                    </div>
                  </div>
                </Label>
              </RadioGroup>

              {mode === "existing" ? (
                <div className="space-y-2">
                  {!analyses ? (
                    <div className="text-xs text-muted-foreground">Loading...</div>
                  ) : analyses.length === 0 ? (
                    <div className="text-xs text-muted-foreground">
                      No analyses yet. You can paste a new JD instead.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {analyses.map((a: any) => (
                        <button
                          key={a._id}
                          onClick={() => setSelectedAnalysisId(a._id)}
                          className={`text-left rounded-md border p-2 text-xs hover:bg-secondary transition ${
                            selectedAnalysisId === a._id ? "border-primary" : "border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">Analysis</span>
                            <Badge variant="outline">
                              {a.matchScore}% match • {a.atsScore}% ATS
                            </Badge>
                          </div>
                          <div className="line-clamp-3 text-muted-foreground">
                            {a.jobDescription}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Textarea
                  value={newJobJd}
                  onChange={(e) => setNewJobJd(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="min-h-32"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                onClick={completeSetup}
                disabled={
                  uploading ||
                  (resumeChoice === "new" && !file) ||
                  (mode === "existing" ? !selectedAnalysisId : !newJobJd.trim())
                }
              >
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Start Practice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-2xl">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Interview Studio
                </span>
                <div className="hidden sm:flex items-center gap-2 text-xs">
                  <Badge variant="secondary">Resume-tailored</Badge>
                  <Badge variant="secondary">50 Q&A</Badge>
                  <Badge variant="secondary">Voice Practice</Badge>
                  <Badge variant="secondary">Polish</Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Your next offer is one great answer away. Configure once, then drill with focus—swap between full-screen Q&A and Voice Mirror anytime.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Compact setup summary moved into hero */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-md border p-3">
                  <div className="font-medium">1) Configure</div>
                  <div className="text-xs text-muted-foreground">Pick resume + JD to tailor your session.</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="font-medium">2) Drill</div>
                  <div className="text-xs text-muted-foreground">Practice 50 curated questions with AI answers.</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="font-medium">3) Voice Mirror</div>
                  <div className="text-xs text-muted-foreground">Speak it out, track metrics, and polish.</div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-md border p-2 text-xs">
                    <span className="font-medium mr-1">Resume:</span>
                    {sessionResumeName || user?.savedResumeName || (resumeChoice === "new" && file?.name) || "Not set"}
                  </div>
                  <div className="rounded-md border p-2 text-xs line-clamp-2">
                    <span className="font-medium mr-1">JD:</span>
                    {effectiveJd ? effectiveJd : "Not set"}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSetupOpen(true)}>
                  Reconfigure
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main: single full-width tool area (switch inside) */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Practice</CardTitle>
              <CardDescription>
                Toggle between Q&A Drills and Voice Mirror below for a focused, full-width experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InterviewCoach
                jobDescription={effectiveJd || undefined}
                resumeFileId={sessionResumeFileId || selectedAnalysis?.resumeFileId}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Tips moved below for breathing room */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Tips</CardTitle>
              <CardDescription>Boost your performance quickly</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border p-3">Speak naturally; aim for 110–150 WPM.</div>
              <div className="rounded-md border p-3">Use STAR implicitly and quantify impact.</div>
              <div className="rounded-md border p-3">Ask a follow-up to deepen your narrative.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}