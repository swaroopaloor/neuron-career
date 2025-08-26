import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [step, setStep] = useState<"upload" | "job-description" | "processing">("upload");
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

  const handleNext = () => {
    if (step === "upload" && file) {
      setStep("job-description");
    }
  };

  const handleSubmit = async () => {
    if (!file || !jobDescription.trim()) {
      toast.error("Please provide both resume and job description");
      return;
    }

    setStep("processing");
    setIsUploading(true);

    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        body: file,
      });

      if (!result.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await result.json();

      // Create analysis
      const analysisId = await createAnalysis({
        resumeFileId: storageId,
        jobDescription: jobDescription.trim(),
      });

      toast.success("Analysis started! Check your dashboard for results.");
      
      // Reset form
      setFile(null);
      setJobDescription("");
      setStep("upload");
      onOpenChange(false);

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to start analysis. Please try again.");
      setStep("job-description");
    } finally {
      setIsUploading(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setJobDescription("");
    setStep("upload");
    setIsUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetDialog();
    }}>
      <DialogContent className="sm:max-w-[600px] elevation-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            New Resume Analysis
          </DialogTitle>
          <DialogDescription>
            Upload your resume and provide a job description for AI-powered analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === "upload" ? "bg-primary text-primary-foreground" : 
              file ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
            }`}>
              {file ? <CheckCircle className="h-4 w-4" /> : "1"}
            </div>
            <div className={`h-0.5 w-12 ${file ? "bg-green-600" : "bg-muted"}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === "job-description" ? "bg-primary text-primary-foreground" :
              step === "processing" ? "bg-green-600 text-white" :
              "bg-muted text-muted-foreground"
            }`}>
              {step === "processing" ? <CheckCircle className="h-4 w-4" /> : "2"}
            </div>
            <div className={`h-0.5 w-12 ${step === "processing" ? "bg-green-600" : "bg-muted"}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === "processing" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "3"}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Label htmlFor="resume" className="text-sm font-medium">
                  Upload Resume (PDF, max 5MB)
                </Label>
                
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : file
                      ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {file ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="mt-2"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="text-sm font-medium text-foreground">
                        Drop your resume here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF files only, up to 5MB
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleNext}
                    disabled={!file}
                    className="ripple"
                  >
                    Next Step
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "job-description" && (
              <motion.div
                key="job-description"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Label htmlFor="job-description" className="text-sm font-medium">
                  Job Description
                </Label>
                <div className="max-h-64 overflow-y-auto p-1">
                  <Textarea
                    id="job-description"
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={8}
                    className="resize-none w-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Provide a detailed job description for the most accurate analysis.
                </p>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep("upload")}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!jobDescription.trim() || isUploading}
                    className="ripple"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Starting Analysis...
                      </>
                    ) : (
                      "Start Analysis"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                    <FileText className="h-6 w-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">
                    Analysis in Progress
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI is analyzing your resume against the job description.
                    This usually takes 30-60 seconds.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}