import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  FileText, 
  X, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"resume-choice" | "upload" | "job-description" | "processing">("resume-choice");
  const [resumeChoice, setResumeChoice] = useState<"saved" | "new" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const generateUploadUrl = useMutation(api.fileUpload.generateUploadUrl);
  const createAnalysis = useMutation(api.analyses.createAnalysis);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

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
    toast.success("Resume uploaded successfully!");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleResumeChoice = (choice: "saved" | "new") => {
    setResumeChoice(choice);
    if (choice === "saved") {
      setStep("job-description");
    } else {
      setStep("upload");
    }
  };

  const handleNext = () => {
    if (step === "upload" && file) {
      setStep("job-description");
    }
  };

  const handleSubmit = async () => {
    if ((!file && resumeChoice !== "saved") || !jobDescription.trim()) {
      toast.error("Please provide both resume and job description");
      return;
    }

    if (resumeChoice === "saved" && !user?.savedResumeId) {
      toast.error("No saved resume found. Please upload a resume.");
      return;
    }

    setStep("processing");
    setIsUploading(true);

    try {
      let resumeFileId = user?.savedResumeId;
      let resumeFileName = user?.savedResumeName;

      if (resumeChoice === "new" && file) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          body: file,
        });

        if (!result.ok) throw new Error("Failed to upload file");
        const { storageId } = await result.json();
        resumeFileId = storageId;
        resumeFileName = file.name;
      }

      if (!resumeFileId) {
        throw new Error("No resume file available");
      }

      await createAnalysis({
        resumeFileId,
        resumeFileName,
        jobDescription: jobDescription.trim(),
      });

      toast.success("Analysis started! Check your dashboard for results.");
      
      onOpenChange(false);

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to start analysis. Please try again.");
      setStep("job-description");
    } finally {
      setIsUploading(false);
    }
  };

  const resetDialog = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setFile(null);
        setJobDescription("");
        setStep("resume-choice");
        setResumeChoice(null);
        setIsUploading(false);
      }, 300);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 30, scale: 0.98 },
    visible: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -30, scale: 0.98 },
  };

  return (
    <Dialog open={open} onOpenChange={resetDialog}>
      <DialogContent className="sm:max-w-[600px] glass elevation-4 border-border">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              New Resume Analysis
            </DialogTitle>
            <DialogDescription>
              Choose your resume and provide a job description for AI-powered analysis.
            </DialogDescription>
          </DialogHeader>
        </motion.div>

        <div className="space-y-6 pt-2">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((num, i) => (
              <>
                <motion.div
                  animate={{
                    scale: (step === "resume-choice" && i === 0) || 
                           ((step === "upload" || (step === "job-description" && resumeChoice === "saved")) && i === 1) || 
                           (step === "job-description" && i === 2) || 
                           (step === "processing" && i === 3) ? 1.1 : 1,
                    background: ((resumeChoice && i === 0) || 
                                (file && i === 1) || 
                                (step === "processing" && i <= 2)) ? "var(--secondary)" : 
                               ((step === "resume-choice" && i === 0) || 
                                (step === "upload" && i === 1) || 
                                (step === "job-description" && i === 2) || 
                                (step === "processing" && i === 3)) ? "var(--primary)" : "var(--muted)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold"
                >
                  {((resumeChoice && i === 0) || (file && i === 1) || (step === "processing" && i <= 2)) ? 
                    <CheckCircle className="h-5 w-5" /> : num}
                </motion.div>
                {i < 3 && <div className={`h-0.5 w-12 bg-muted`} />}
              </>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === "resume-choice" && (
              <motion.div
                key="resume-choice"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <Label className="font-medium">Choose Resume Source</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user?.savedResumeId && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        resumeChoice === "saved" ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50"
                      }`}
                      onClick={() => handleResumeChoice("saved")}
                    >
                      <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="font-medium text-foreground mb-2">Use Saved Resume</h3>
                      <p className="text-sm text-muted-foreground">{user.savedResumeName || "Default Resume"}</p>
                    </motion.div>
                  )}
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      resumeChoice === "new" ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50"
                    }`}
                    onClick={() => handleResumeChoice("new")}
                  >
                    <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-medium text-foreground mb-2">Upload New Resume</h3>
                    <p className="text-sm text-muted-foreground">Choose a different PDF file</p>
                  </motion.div>
                </div>

                {!user?.savedResumeId && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Tip:</strong> Save a default resume in your profile for quicker analysis next time.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {step === "upload" && (
              <motion.div
                key="upload"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <Label htmlFor="resume" className="font-medium">
                  Upload Resume (PDF, max 5MB)
                </Label>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/10"
                      : file
                      ? "border-secondary bg-secondary/10"
                      : "border-muted hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                >
                  <input id="resume" type="file" accept=".pdf" onChange={handleFileInput} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  
                  <AnimatePresence>
                    {file ? (
                      <motion.div key="uploaded" initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} className="space-y-2">
                        <CheckCircle className="h-12 w-12 text-secondary mx-auto" />
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="mt-2 text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div key="upload-prompt" initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} className="space-y-2">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="font-medium text-foreground">Drop your resume here, or click to browse</p>
                        <p className="text-xs text-muted-foreground">PDF files only, up to 5MB</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep("resume-choice")}>Back</Button>
                  <Button onClick={handleNext} disabled={!file}>Next Step</Button>
                </div>
              </motion.div>
            )}

            {step === "job-description" && (
              <motion.div key="job-description" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                <Label htmlFor="job-description" className="font-medium">Job Description</Label>
                <Textarea 
                  id="job-description" 
                  placeholder="Paste the job description here..." 
                  value={jobDescription} 
                  onChange={(e) => setJobDescription(e.target.value)} 
                  rows={8} 
                  className="bg-background/50 focus:bg-background resize-none overflow-y-auto" 
                />
                <p className="text-xs text-muted-foreground">Provide a detailed job description for the most accurate analysis.</p>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(resumeChoice === "saved" ? "resume-choice" : "upload")}>Back</Button>
                  <Button onClick={handleSubmit} disabled={!jobDescription.trim() || isUploading}>
                    {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting...</> : "Start Analysis"}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div key="processing" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="text-center py-8">
                <div className="space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full" />
                    <FileText className="h-6 w-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Analysis in Progress</h3>
                  <p className="text-sm text-muted-foreground">Our AI is working its magic. This usually takes 30-60 seconds.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}