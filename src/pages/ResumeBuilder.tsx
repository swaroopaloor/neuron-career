import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Eye, 
  Edit3,
  Loader2,
  User,
  Briefcase,
  GraduationCap,
  Award
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRef } from "react";
import { Download } from "lucide-react";

type ResumePersonalInfo = {
  name: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
};

type ResumeExperience = {
  title: string;
  company: string;
  duration: string;
  description: string;
};

type ResumeEducation = {
  degree: string;
  school: string;
  year: string;
  gpa?: string;
};

type ResumeData = {
  personalInfo: ResumePersonalInfo;
  summary: string;
  experience: Array<ResumeExperience>;
  education: Array<ResumeEducation>;
  skills: Array<string>;
};

const defaultResumeData: ResumeData = {
  personalInfo: {
    name: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
};

function PreviewPanel({ resumeData, containerRef }: { resumeData: ResumeData; containerRef?: React.RefObject<HTMLDivElement> }) {
  return (
    <div ref={containerRef} className="bg-white text-black p-8 shadow-lg rounded-lg min-h-[800px] max-w-[8.5in] mx-auto">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {resumeData.personalInfo.name || "Your Name"}
        </h1>
        <div className="text-sm text-gray-600 space-y-1">
          {/* Line 1: email • phone • location */}
          <div className="flex items-center justify-center">
            {(() => {
              const parts = [
                resumeData.personalInfo.email,
                resumeData.personalInfo.phone,
                resumeData.personalInfo.location,
              ].filter((s) => !!s && s.trim().length > 0) as string[];
              return parts.map((part, idx) => (
                <span key={`info-line1-${idx}`} className="inline-flex items-center">
                  {part}
                  {idx < parts.length - 1 && <span className="mx-2 text-gray-400">•</span>}
                </span>
              ));
            })()}
          </div>
          {/* Line 2: website • linkedin */}
          <div className="flex items-center justify-center">
            {(() => {
              const parts = [
                resumeData.personalInfo.website,
                resumeData.personalInfo.linkedin,
              ].filter((s) => !!s && s.trim().length > 0) as string[];
              return parts.map((part, idx) => (
                <span key={`info-line2-${idx}`} className="inline-flex items-center">
                  {part}
                  {idx < parts.length - 1 && <span className="mx-2 text-gray-400">•</span>}
                </span>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Summary */}
      {resumeData.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-1 mb-3">
            Professional Summary
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{resumeData.summary}</p>
        </div>
      )}

      {/* Experience */}
      {resumeData.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-1 mb-3">
            Work Experience
          </h2>
          <div className="space-y-4">
            {resumeData.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-gray-800">{exp.title || "Job Title"}</h3>
                  <span className="text-sm text-gray-600">{exp.duration}</span>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {exp.company || "Company Name"}
                </p>
                {exp.description && (
                  <p className="text-sm text-gray-700 leading-relaxed">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {resumeData.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-1 mb-3">
            Education
          </h2>
          <div className="space-y-3">
            {resumeData.education.map((edu, index) => (
              <div key={index}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{edu.degree || "Degree"}</h3>
                    <p className="text-sm text-gray-700">{edu.school || "School Name"}</p>
                    {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                  </div>
                  <span className="text-sm text-gray-600">{edu.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {resumeData.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-1 mb-3">
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.map((skill, index) => (
              <span key={index} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type EditorHandlers = {
  updatePersonalInfo: (field: keyof ResumeData["personalInfo"], value: string) => void;
  addExperience: () => void;
  updateExperience: (index: number, field: string, value: string) => void;
  removeExperience: (index: number) => void;
  addEducation: () => void;
  updateEducation: (index: number, field: string, value: string) => void;
  removeEducation: (index: number) => void;
  updateSkills: (skillsText: string) => void;
  setSummary: (value: string) => void;
  refineSummary: () => void;
  refineExperience: (index: number) => void;
};

function EditorPanel({
  resumeData,
  handlers,
  refineStates,
}: {
  resumeData: ResumeData;
  handlers: EditorHandlers;
  refineStates?: { isRefiningSummary: boolean; refiningExpIndex: number | null };
}) {
  const {
    updatePersonalInfo,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    updateSkills,
    setSummary,
    refineSummary,
    refineExperience,
  } = handlers;

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={resumeData.personalInfo.name}
                onChange={(e) => updatePersonalInfo("name", e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={resumeData.personalInfo.email}
                onChange={(e) => updatePersonalInfo("email", e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={resumeData.personalInfo.phone}
                onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={resumeData.personalInfo.location}
                onChange={(e) => updatePersonalInfo("location", e.target.value)}
                placeholder="City, State"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={resumeData.personalInfo.website || ""}
                onChange={(e) => updatePersonalInfo("website", e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={resumeData.personalInfo.linkedin || ""}
                onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                placeholder="linkedin.com/in/yourprofile"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Professional Summary</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlers.refineSummary()}
            disabled={refineStates?.isRefiningSummary}
            className="gap-2"
          >
            {refineStates?.isRefiningSummary ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Refining
              </>
            ) : (
              "Refine"
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-[120px] resize-none"
            value={resumeData.summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Write a compelling professional summary that highlights your key achievements and career objectives..."
          />
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Experience
          </CardTitle>
          <Button onClick={addExperience} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Experience
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {resumeData.experience.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border rounded-lg space-y-4 bg-secondary/20"
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-foreground">Experience #{index + 1}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExperience(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Job Title *</Label>
                  <Input
                    value={exp.title}
                    onChange={(e) => updateExperience(index, "title", e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>
                <div>
                  <Label>Company *</Label>
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    placeholder="Tech Corp"
                  />
                </div>
              </div>

              <div>
                <Label>Duration</Label>
                <Input
                  value={exp.duration}
                  onChange={(e) => updateExperience(index, "duration", e.target.value)}
                  placeholder="Jan 2020 - Present"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlers.refineExperience(index)}
                    disabled={refineStates?.refiningExpIndex === index}
                    className="gap-2"
                  >
                    {refineStates?.refiningExpIndex === index ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Refining
                      </>
                    ) : (
                      "Refine"
                    )}
                  </Button>
                </div>
                <Textarea
                  className="min-h-[100px] resize-none"
                  value={exp.description}
                  onChange={(e) => updateExperience(index, "description", e.target.value)}
                  placeholder={"• Describe your key responsibilities and achievements\n• Use bullet points for better readability\n• Include quantifiable results when possible"}
                />
              </div>
            </motion.div>
          ))}

          {resumeData.experience.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No work experience added yet.</p>
              <p className="text-sm">Click "Add Experience" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education
          </CardTitle>
          <Button onClick={addEducation} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Education
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {resumeData.education.map((edu, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border rounded-lg space-y-4 bg-secondary/20"
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-foreground">Education #{index + 1}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEducation(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Degree *</Label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    placeholder="Bachelor of Science in Computer Science"
                  />
                </div>
                <div>
                  <Label>School *</Label>
                  <Input
                    value={edu.school}
                    onChange={(e) => updateEducation(index, "school", e.target.value)}
                    placeholder="University Name"
                  />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input
                    value={edu.year}
                    onChange={(e) => updateEducation(index, "year", e.target.value)}
                    placeholder="2020"
                  />
                </div>
                <div>
                  <Label>GPA (Optional)</Label>
                  <Input
                    value={edu.gpa || ""}
                    onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                    placeholder="3.8"
                  />
                </div>
              </div>
            </motion.div>
          ))}

          {resumeData.education.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No education added yet.</p>
              <p className="text-sm">Click "Add Education" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Skills (comma-separated)</Label>
            <Textarea
              className="min-h-[80px] resize-none"
              value={resumeData.skills.join(", ")}
              onChange={(e) => updateSkills(e.target.value)}
              placeholder="JavaScript, React, Node.js, Python, SQL, Git, Agile, Problem Solving"
            />
            <p className="text-xs text-muted-foreground">
              Separate each skill with a comma. These will appear as tags in your resume.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResumeBuilder() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDefaultDialog, setShowDefaultDialog] = useState(false);
  const [uploadedPdf, setUploadedPdf] = useState<{ id: string; name: string } | null>(null);
  const [isRefiningSummary, setIsRefiningSummary] = useState(false);
  const [refiningExpIndex, setRefiningExpIndex] = useState<number | null>(null);

  const generateUploadUrl = useMutation(api.fileUpload.generateUploadUrl);
  const updateProfile = useMutation(api.users.updateProfile);
  const refineText = useAction(api.aiAnalysis.refineText);

  const handleExportPDF = async () => {
    if (!previewRef.current) {
      toast.error("Preview not ready. Try again in a moment.");
      return;
    }
    setIsExporting(true);
    try {
      // Render preview to canvas
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      // Create PDF and fit the page
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const finalWidth = canvas.width * ratio;
      const finalHeight = canvas.height * ratio;
      const x = (pageWidth - finalWidth) / 2;
      const y = 0;

      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight, undefined, "FAST");

      const fileName = `${resumeData.personalInfo.name || "Resume"}-${new Date().toISOString().slice(0, 10)}.pdf`;

      // Prompt user to download locally
      pdf.save(fileName);

      // Upload to Convex storage
      const blob = pdf.output("blob");
      const uploadUrl = await generateUploadUrl({});
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/pdf",
          "x-file-name": fileName,
        },
        body: blob,
      });
      const { storageId } = await uploadRes.json();

      setUploadedPdf({ id: storageId, name: fileName });
      setShowDefaultDialog(true);
      toast.success("PDF exported! You can set it as your default resume.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, { title: "", company: "", duration: "", description: "" }]
    }));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { degree: "", school: "", year: "", gpa: "" }]
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateSkills = (skillsText: string) => {
    const skills = skillsText.split(',').map(s => s.trim()).filter(s => s);
    setResumeData(prev => ({ ...prev, skills }));
  };

  const handleRefineSummary = async () => {
    const text = resumeData.summary?.trim() || "";
    if (!text) {
      toast.error("Please write your summary before refining.");
      return;
    }
    try {
      setIsRefiningSummary(true);
      const refined = await refineText({ text });
      setResumeData((prev) => ({ ...prev, summary: refined || text }));
      toast.success("Summary refined!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to refine summary. Please try again.");
    } finally {
      setIsRefiningSummary(false);
    }
  };

  const handleRefineExperience = async (index: number) => {
    const current = resumeData.experience[index]?.description?.trim() || "";
    if (!current) {
      toast.error("Please add a description before refining.");
      return;
    }
    try {
      setRefiningExpIndex(index);
      const refined = await refineText({ text: current });
      setResumeData((prev) => ({
        ...prev,
        experience: prev.experience.map((exp, i) =>
          i === index ? { ...exp, description: refined || current } : exp
        ),
      }));
      toast.success("Description refined!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to refine description. Please try again.");
    } finally {
      setRefiningExpIndex(null);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Resume Builder
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and customize your professional resume
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              variant="outline"
              className="flex items-center"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Mobile Tabs / Desktop Split Layout */}
        <div className="lg:hidden">
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="space-y-6">
              <EditorPanel
                resumeData={resumeData}
                handlers={{
                  updatePersonalInfo,
                  addExperience,
                  updateExperience,
                  removeExperience,
                  addEducation,
                  updateEducation,
                  removeEducation,
                  updateSkills,
                  setSummary: (value: string) =>
                    setResumeData((prev) => ({ ...prev, summary: value })),
                  refineSummary: handleRefineSummary,
                  refineExperience: handleRefineExperience,
                }}
                refineStates={{
                  isRefiningSummary,
                  refiningExpIndex,
                }}
              />
            </TabsContent>
            
            <TabsContent value="preview">
              <PreviewPanel resumeData={resumeData} containerRef={previewRef} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <EditorPanel
              resumeData={resumeData}
              handlers={{
                updatePersonalInfo,
                addExperience,
                updateExperience,
                removeExperience,
                addEducation,
                updateEducation,
                removeEducation,
                updateSkills,
                setSummary: (value: string) =>
                  setResumeData((prev) => ({ ...prev, summary: value })),
                refineSummary: handleRefineSummary,
                refineExperience: handleRefineExperience,
              }}
              refineStates={{
                isRefiningSummary,
                refiningExpIndex,
              }}
            />
          </motion.div>
          
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="sticky top-24 h-fit"
          >
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </h2>
              <p className="text-sm text-muted-foreground">
                See how your resume looks as you edit
              </p>
            </div>
            <div className="border rounded-lg overflow-hidden bg-white">
              <PreviewPanel resumeData={resumeData} containerRef={previewRef} />
            </div>
          </motion.div>
        </div>

        <AlertDialog open={showDefaultDialog} onOpenChange={setShowDefaultDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Set this PDF as your default resume?</AlertDialogTitle>
              <AlertDialogDescription>
                We've exported your resume as a PDF. You can set this file as your default resume so it's used for uploads and quick access across the app.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Not now</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (!uploadedPdf) return;
                  try {
                    await updateProfile({
                      savedResumeId: uploadedPdf.id as any,
                      savedResumeName: uploadedPdf.name,
                    });
                    toast.success("Default resume updated!");
                  } catch (e) {
                    console.error(e);
                    toast.error("Failed to set default resume.");
                  } finally {
                    setShowDefaultDialog(false);
                  }
                }}
              >
                Set as Default
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}