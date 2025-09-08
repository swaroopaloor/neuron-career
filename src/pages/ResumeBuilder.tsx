import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { AuthRedirect } from "@/components/AuthRedirect";
import { TemplateLibrary } from "@/components/TemplateLibrary";
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

/* removed local refineText helper; now using Convex action aiResumeProcessor.refineText */

function PreviewPanel({ resumeData, containerRef, variant = "classic" }: { resumeData: ResumeData; containerRef?: React.RefObject<HTMLDivElement>; variant?: "classic" | "modern" | "minimal" | "technical" | "elegant" | "compact" | "creative" | "executive" }) {
  // Style presets by variant
  const containerVariant =
    variant === "modern"
      ? "bg-white text-black p-10 shadow-xl rounded-xl border border-gray-200"
      : variant === "minimal"
      ? "bg-white text-black p-10 shadow-lg rounded-lg"
      : variant === "technical"
      ? "bg-white text-black p-10 shadow-lg rounded-lg"
      : variant === "elegant"
      ? "bg-white text-black p-10 shadow-lg rounded-xl border border-rose-200"
      : variant === "compact"
      ? "bg-white text-black p-8 shadow-md rounded-md"
      : variant === "creative"
      ? "bg-white text-black p-10 shadow-xl rounded-xl border-2 border-purple-400"
      : variant === "executive"
      ? "bg-white text-black p-10 shadow-lg rounded-xl border border-amber-300"
      : "bg-white text-black p-10 shadow-lg rounded-lg";

  const headerBorderClass =
    variant === "modern"
      ? "border-b-4 border-primary/70"
      : variant === "minimal"
      ? "border-b border-gray-200"
      : variant === "technical"
      ? "border-b-2 border-gray-800"
      : variant === "elegant"
      ? "border-b-2 border-rose-300"
      : variant === "compact"
      ? "border-b border-gray-300"
      : variant === "creative"
      ? "border-b-4 border-purple-400"
      : variant === "executive"
      ? "border-b-2 border-amber-400"
      : "border-b-2 border-gray-300";

  const nameClass =
    variant === "modern"
      ? "text-[30px] font-extrabold tracking-tight text-gray-900"
      : variant === "minimal"
      ? "text-[26px] font-semibold text-gray-900"
      : variant === "technical"
      ? "text-[26px] font-bold text-gray-900 font-mono"
      : variant === "elegant"
      ? "text-[28px] font-semibold tracking-wide text-gray-900"
      : variant === "compact"
      ? "text-[24px] font-bold text-gray-900"
      : variant === "creative"
      ? "text-[30px] font-extrabold text-gray-900"
      : variant === "executive"
      ? "text-[28px] font-semibold tracking-[0.06em] text-gray-900"
      : "text-[28px] font-bold text-gray-900";

  const infoTextClass =
    variant === "technical"
      ? "text-[12px] text-gray-700 font-mono"
      : variant === "compact"
      ? "text-[11px] text-gray-700"
      : "text-[12px] text-gray-700";

  const sectionTitleClass =
    variant === "modern"
      ? "text-[13px] font-bold uppercase tracking-[0.16em] text-gray-900 border-b-2 border-primary/50 pb-1 mb-3"
      : variant === "minimal"
      ? "text-[13px] font-semibold tracking-wide text-gray-800 pb-1 mb-3"
      : variant === "technical"
      ? "text-[13px] font-bold uppercase tracking-[0.18em] text-gray-900 border-b border-gray-800 pb-1 mb-3 font-mono"
      : variant === "elegant"
      ? "text-[13px] font-semibold uppercase tracking-[0.12em] text-rose-900 border-b border-rose-300 pb-1 mb-3"
      : variant === "compact"
      ? "text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-800 border-b border-gray-300 pb-1 mb-2"
      : variant === "creative"
      ? "text-[13px] font-bold uppercase tracking-[0.16em] text-purple-900 border-b-4 border-purple-400 pb-1 mb-3"
      : variant === "executive"
      ? "text-[13px] font-semibold uppercase tracking-[0.14em] text-amber-900 border-b border-amber-400 pb-1 mb-3"
      : "text-[14px] font-semibold uppercase tracking-[0.12em] text-gray-800 border-b border-gray-300 pb-1 mb-3";

  const jobTitleClass =
    variant === "technical"
      ? "text-[14px] font-bold text-gray-900 font-mono"
      : variant === "compact"
      ? "text-[13px] font-semibold text-gray-900"
      : "text-[14px] font-semibold text-gray-900";

  const companyClass = "text-[13px] font-medium text-gray-800";

  const durationClass =
    variant === "modern"
      ? "text-[12px] text-primary/80"
      : variant === "technical"
      ? "text-[12px] text-gray-700 font-mono"
      : variant === "creative"
      ? "text-[12px] text-purple-700"
      : variant === "elegant"
      ? "text-[12px] text-rose-700"
      : variant === "executive"
      ? "text-[12px] text-amber-700"
      : "text-[12px] text-gray-600";

  const bodyTextClass =
    variant === "technical"
      ? "text-[13px] text-gray-800 leading-[1.6] font-mono"
      : variant === "compact"
      ? "text-[12.5px] text-gray-800 leading-[1.45]"
      : "text-[13px] text-gray-800 leading-[1.6]";

  const skillTagClass =
    variant === "modern"
      ? "bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[12px] border border-primary/20"
      : variant === "minimal"
      ? "bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md text-[12px]"
      : variant === "technical"
      ? "bg-black text-white px-2 py-0.5 rounded text-[11px] font-mono"
      : variant === "elegant"
      ? "bg-rose-50 text-rose-900 px-2.5 py-1 rounded-full text-[12px] border border-rose-200"
      : variant === "compact"
      ? "bg-gray-200 text-gray-900 px-2 py-0.5 rounded text-[11px]"
      : variant === "creative"
      ? "bg-purple-100 text-purple-900 px-2.5 py-1 rounded-full text-[12px] border border-purple-300"
      : variant === "executive"
      ? "bg-amber-50 text-amber-900 px-2.5 py-1 rounded-full text-[12px] border border-amber-300"
      : "bg-gray-200 text-gray-800 px-2.5 py-1 rounded-full text-[12px]";

  return (
    <div
      ref={containerRef}
      className={`${containerVariant} min-h-[1000px] max-w-[8.5in] mx-auto antialiased`}
    >
      {/* Header */}
      <div className={`text-center ${headerBorderClass} pb-4 mb-6`}>
        <h1 className={`${nameClass} leading-[1.1] mb-1`}>
          {resumeData.personalInfo.name || "Your Name"}
        </h1>
        <div className={`${infoTextClass} space-y-1`}>
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
          <h2 className={sectionTitleClass}>
            Professional Summary
          </h2>
          <p className={bodyTextClass}>{resumeData.summary}</p>
        </div>
      )}

      {/* Experience */}
      {resumeData.experience.length > 0 && (
        <div className="mb-6">
          <h2 className={sectionTitleClass}>
            Work Experience
          </h2>
          <div className="space-y-4">
            {resumeData.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className={jobTitleClass}>{exp.title || "Job Title"}</h3>
                  <span className={durationClass}>{exp.duration}</span>
                </div>
                <p className={companyClass}>
                  {exp.company || "Company Name"}
                </p>
                {exp.description && (
                  <p className={`${bodyTextClass} whitespace-pre-line`}>{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {resumeData.education.length > 0 && (
        <div className="mb-6">
          <h2 className={sectionTitleClass}>
            Education
          </h2>
          <div className="space-y-3">
            {resumeData.education.map((edu, index) => (
              <div key={index}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={jobTitleClass}>{edu.degree || "Degree"}</h3>
                    <p className={bodyTextClass.replace("leading-[1.6]", "")}>{edu.school || "School Name"}</p>
                    {edu.gpa && <p className="text-[12px] text-gray-600">GPA: {edu.gpa}</p>}
                  </div>
                  <span className={durationClass}>{edu.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {resumeData.skills.length > 0 && (
        <div className="mb-6">
          <h2 className={sectionTitleClass}>
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.map((skill, index) => (
              <span
                key={index}
                className={skillTagClass}
              >
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

  // Add local state for skills input to avoid normalizing while typing
  const [skillsInput, setSkillsInput] = useState(resumeData.skills.join(", "));

  // Keep the textbox in sync when resumeData.skills changes elsewhere
  useEffect(() => {
    setSkillsInput(resumeData.skills.join(", "));
  }, [resumeData.skills.join(", ")]);

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
              value={skillsInput}
              onChange={(e) => {
                setSkillsInput(e.target.value);
                updateSkills(e.target.value);
              }}
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
  const [isRefiningSummary, setIsRefiningSummary] = useState(false);
  const [refiningExpIndex, setRefiningExpIndex] = useState<number | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<"classic" | "modern" | "minimal" | "technical" | "elegant" | "compact" | "creative" | "executive">("classic");

  // Use Groq-backed Convex action for refinement
  const refineTextAI = useAction(api.aiResumeProcessor.refineText);

  const openPrintDialogFromPreview = async (): Promise<boolean> => {
    const source = previewRef.current;
    if (!source) return false;

    // Get the selected style variant
    const currentVariant = selectedStyle;

    // Create a clean, professional print document
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return false;

    // Get all computed styles and CSS variables
    const rootComputed = getComputedStyle(document.documentElement);
    const bodyComputed = getComputedStyle(document.body);
    
    // Extract CSS variables for theming
    let cssVars = '';
    for (let i = 0; i < rootComputed.length; i++) {
      const name = rootComputed[i];
      if (name.startsWith('--')) {
        cssVars += `${name}: ${rootComputed.getPropertyValue(name)};`;
      }
    }

    // Get variant-specific styles
    const getVariantStyles = (variant: string) => {
      const baseStyles = {
        classic: `
          .resume-container { background: white; color: black; padding: 0.5in; box-shadow: none; border: none; }
          .resume-header { border-bottom: 2px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1.5rem; }
          .resume-name { font-size: 28px; font-weight: bold; color: #111827; margin-bottom: 0.25rem; }
          .resume-info { font-size: 12px; color: #6b7280; }
          .section-title { font-size: 14px; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25rem; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
          .job-title { font-size: 14px; font-weight: 600; color: #111827; }
          .company-name { font-size: 13px; font-weight: 500; color: #374151; }
          .duration { font-size: 12px; color: #6b7280; }
          .description { font-size: 13px; color: #374151; line-height: 1.5; }
          .skill-tag { background: #f3f4f6; color: #374151; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 12px; display: inline-block; margin: 0.125rem; }
        `,
        modern: `
          .resume-container { background: white; color: black; padding: 0.5in; box-shadow: none; border: none; }
          .resume-header { border-bottom: 4px solid #3b82f6; padding-bottom: 1rem; margin-bottom: 1.5rem; }
          .resume-name { font-size: 30px; font-weight: 800; color: #111827; margin-bottom: 0.25rem; letter-spacing: -0.025em; }
          .resume-info { font-size: 12px; color: #6b7280; }
          .section-title { font-size: 13px; font-weight: 700; color: #111827; border-bottom: 2px solid #3b82f6; padding-bottom: 0.25rem; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.16em; }
          .job-title { font-size: 14px; font-weight: 600; color: #111827; }
          .company-name { font-size: 13px; font-weight: 500; color: #374151; }
          .duration { font-size: 12px; color: #3b82f6; }
          .description { font-size: 13px; color: #374151; line-height: 1.6; }
          .skill-tag { background: #eff6ff; color: #1e40af; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 12px; border: 1px solid #dbeafe; display: inline-block; margin: 0.125rem; }
        `,
        minimal: `
          .resume-container { background: white; color: black; padding: 0.5in; box-shadow: none; border: none; }
          .resume-header { border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1.5rem; }
          .resume-name { font-size: 26px; font-weight: 600; color: #111827; margin-bottom: 0.25rem; }
          .resume-info { font-size: 12px; color: #6b7280; }
          .section-title { font-size: 13px; font-weight: 600; color: #374151; padding-bottom: 0.25rem; margin-bottom: 0.75rem; letter-spacing: 0.05em; }
          .job-title { font-size: 14px; font-weight: 600; color: #111827; }
          .company-name { font-size: 13px; font-weight: 500; color: #374151; }
          .duration { font-size: 12px; color: #6b7280; }
          .description { font-size: 13px; color: #374151; line-height: 1.6; }
          .skill-tag { background: #f9fafb; color: #374151; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 12px; display: inline-block; margin: 0.125rem; }
        `,
        technical: `
          .resume-container { background: white; color: black; padding: 0.5in; box-shadow: none; border: none; font-family: 'Courier New', monospace; }
          .resume-header { border-bottom: 2px solid #1f2937; padding-bottom: 1rem; margin-bottom: 1.5rem; }
          .resume-name { font-size: 26px; font-weight: bold; color: #111827; margin-bottom: 0.25rem; }
          .resume-info { font-size: 12px; color: #6b7280; }
          .section-title { font-size: 13px; font-weight: bold; color: #111827; border-bottom: 1px solid #1f2937; padding-bottom: 0.25rem; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.18em; }
          .job-title { font-size: 14px; font-weight: bold; color: #111827; }
          .company-name { font-size: 13px; font-weight: 500; color: #374151; }
          .duration { font-size: 12px; color: #6b7280; }
          .description { font-size: 13px; color: #374151; line-height: 1.6; }
          .skill-tag { background: #000; color: #fff; padding: 0.125rem 0.5rem; border-radius: 0.125rem; font-size: 11px; display: inline-block; margin: 0.125rem; }
        `,
        elegant: `
          .resume-container { background: white; color: black; padding: 0.5in; box-shadow: none; border: none; }
          .resume-header { border-bottom: 2px solid #fda4af; padding-bottom: 1rem; margin-bottom: 1.5rem; }
          .resume-name { font-size: 28px; font-weight: 600; color: #111827; margin-bottom: 0.25rem; letter-spacing: 0.05em; }
          .resume-info { font-size: 12px; color: #6b7280; }
          .section-title { font-size: 13px; font-weight: 600; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 0.25rem; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; }
          .job-title { font-size: 14px; font-weight: 600; color: #111827; }
          .company-name { font-size: 13px; font-weight: 500; color: #374151; }
          .duration { font-size: 12px; color: #be123c; }
          .description { font-size: 13px; color: #374151; line-height: 1.6; }
          .skill-tag { background: #fff1f2; color: #881337; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 12px; border: 1px solid #fecdd3; display: inline-block; margin: 0.125rem; }
        `,
        compact: `
          .resume-container { background: white; color: black; padding: 0.4in; box-shadow: none; border: none; }
          .resume-header { border-bottom: 1px solid #d1d5db; padding-bottom: 0.75rem; margin-bottom: 1rem; }
          .resume-name { font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 0.25rem; }
          .resume-info { font-size: 11px; color: #6b7280; }
          .section-title { font-size: 12px; font-weight: 600; color: #374151; border-bottom: 1px solid #d1d5db; padding-bottom: 0.25rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; }
          .job-title { font-size: 13px; font-weight: 600; color: #111827; }
          .company-name { font-size: 12px; font-weight: 500; color: #374151; }
          .duration { font-size: 11px; color: #6b7280; }
          .description { font-size: 12.5px; color: #374151; line-height: 1.45; }
          .skill-tag { background: #e5e7eb; color: #111827; padding: 0.125rem 0.5rem; border-radius: 0.125rem; font-size: 11px; display: inline-block; margin: 0.125rem; }
        `,
        creative: `
          .resume-container { background: white; color: black; padding: 0.5in; box-shadow: none; border: 2px solid #c084fc; }
          .resume-header { border-bottom: 4px solid #c084fc; padding-bottom: 1rem; margin-bottom: 1.5rem; }
          .resume-name { font-size: 30px; font-weight: 800; color: #111827; margin-bottom: 0.25rem; }
          .resume-info { font-size: 12px; color: #6b7280; }
          .section-title { font-size: 13px; font-weight: 700; color: #581c87; border-bottom: 4px solid #c084fc; padding-bottom: 0.25rem; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.16em; }
          .job-title { font-size: 14px; font-weight: 600; color: #111827; }
          .company-name { font-size: 13px; font-weight: 500; color: #374151; }
          .duration { font-size: 12px; color: #7c3aed; }
          .description { font-size: 13px; color: #374151; line-height: 1.6; }
          .skill-tag { background: #f3e8ff; color: #581c87; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 12px; border: 1px solid #d8b4fe; display: inline-block; margin: 0.125rem; }
        `,
        executive: `
          .resume-container { background: white; color: black; padding: 0.5in; box-shadow: none; border: 1px solid #fbbf24; }
          .resume-header { border-bottom: 2px solid #fbbf24; padding-bottom: 1rem; margin-bottom: 1.5rem; }
          .resume-name { font-size: 28px; font-weight: 600; color: #111827; margin-bottom: 0.25rem; letter-spacing: 0.06em; }
          .resume-info { font-size: 12px; color: #6b7280; }
          .section-title { font-size: 13px; font-weight: 600; color: #92400e; border-bottom: 1px solid #fbbf24; padding-bottom: 0.25rem; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.14em; }
          .job-title { font-size: 14px; font-weight: 600; color: #111827; }
          .company-name { font-size: 13px; font-weight: 500; color: #374151; }
          .duration { font-size: 12px; color: #d97706; }
          .description { font-size: 13px; color: #374151; line-height: 1.6; }
          .skill-tag { background: #fffbeb; color: #92400e; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 12px; border: 1px solid #fed7aa; display: inline-block; margin: 0.125rem; }
        `
      };

      const variantStyles = getVariantStyles(currentVariant);

      // Create the HTML content
      const printHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Resume - ${resumeData.personalInfo.name || 'Professional Resume'}</title>
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    /* Print-specific styles to remove browser headers/footers */
    @page {
      size: letter portrait;
      margin: 0.5in;
    }
    
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        min-height: 0 !important;
      }
      
      /* Hide browser headers/footers */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
    
    /* Root variables */
    :root {
      ${cssVars}
    }
    
    /* Body styles */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    /* Container */
    .resume-container {
      width: 7.5in;
      margin: 0 auto;
      min-height: 10in;
    }
    
    /* Header */
    .resume-header {
      text-align: center;
    }
    
    .resume-name {
      line-height: 1.1;
    }
    
    .resume-info {
      line-height: 1.4;
    }
    
    .info-line {
      margin: 0.25rem 0;
    }
    
    .info-separator {
      margin: 0 0.5rem;
      color: #9ca3af;
    }
    
    /* Sections */
    .resume-section {
      margin-bottom: 1.5rem;
    }
    
    .section-title {
      margin-bottom: 0.75rem;
    }
    
    /* Experience */
    .experience-item {
      margin-bottom: 1rem;
    }
    
    .experience-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.25rem;
    }
    
    .job-title {
      margin-bottom: 0.125rem;
    }
    
    .company-name {
      margin-bottom: 0.5rem;
    }
    
    .duration {
      white-space: nowrap;
    }
    
    .description {
      white-space: pre-line;
      margin-bottom: 0.5rem;
    }
    
    /* Education */
    .education-item {
      margin-bottom: 0.75rem;
    }
    
    .education-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    /* Skills */
    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .skill-tag {
      display: inline-block;
    }
    
    /* Variant-specific styles */
    ${variantStyles}
    
    /* Ensure proper spacing */
    .mb-1 { margin-bottom: 0.25rem !important; }
    .mb-2 { margin-bottom: 0.5rem !important; }
    .mb-3 { margin-bottom: 0.75rem !important; }
    .mb-4 { margin-bottom: 1rem !important; }
    .mb-6 { margin-bottom: 1.5rem !important; }
    
    .space-y-1 > * + * { margin-top: 0.25rem !important; }
    .space-y-2 > * + * { margin-top: 0.5rem !important; }
    .space-y-3 > * + * { margin-top: 0.75rem !important; }
    .space-y-4 > * + * { margin-top: 1rem !important; }
    
    .gap-2 { gap: 0.5rem !important; }
    .gap-3 { gap: 0.75rem !important; }
    .gap-4 { gap: 1rem !important; }
    
    /* Remove any animations or transitions */
    * {
      animation: none !important;
      transition: none !important;
      transform: none !important;
    }
  </style>
</head>
<body>
  <div class="resume-container">
    <!-- Header -->
    <div class="resume-header">
      <h1 class="resume-name">${resumeData.personalInfo.name || 'Your Name'}</h1>
      <div class="resume-info">
        ${resumeData.personalInfo.email ? `<div class="info-line">${resumeData.personalInfo.email}</div>` : ''}
        ${resumeData.personalInfo.phone || resumeData.personalInfo.location ? `
          <div class="info-line">
            ${resumeData.personalInfo.phone ? resumeData.personalInfo.phone : ''}
            ${resumeData.personalInfo.phone && resumeData.personalInfo.location ? '<span class="info-separator">•</span>' : ''}
            ${resumeData.personalInfo.location ? resumeData.personalInfo.location : ''}
          </div>
        ` : ''}
        ${resumeData.personalInfo.website || resumeData.personalInfo.linkedin ? `
          <div class="info-line">
            ${resumeData.personalInfo.website ? resumeData.personalInfo.website : ''}
            ${resumeData.personalInfo.website && resumeData.personalInfo.linkedin ? '<span class="info-separator">•</span>' : ''}
            ${resumeData.personalInfo.linkedin ? resumeData.personalInfo.linkedin : ''}
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Summary -->
    ${resumeData.summary ? `
      <div class="resume-section">
        <h2 class="section-title">Professional Summary</h2>
        <p>${resumeData.summary}</p>
      </div>
    ` : ''}

    <!-- Experience -->
    ${resumeData.experience.length > 0 ? `
      <div class="resume-section">
        <h2 class="section-title">Work Experience</h2>
        ${resumeData.experience.map(exp => `
          <div class="experience-item">
            <div class="experience-header">
              <div>
                <h3 class="job-title">${exp.title || 'Job Title'}</h3>
                <p class="company-name">${exp.company || 'Company Name'}</p>
              </div>
              ${exp.duration ? `<span class="duration">${exp.duration}</span>` : ''}
            </div>
            ${exp.description ? `<p class="description">${exp.description}</p>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Education -->
    ${resumeData.education.length > 0 ? `
      <div class="resume-section">
        <h2 class="section-title">Education</h2>
        ${resumeData.education.map(edu => `
          <div class="education-item">
            <div class="education-header">
              <div>
                <h3 class="job-title">${edu.degree || 'Degree'}</h3>
                <p>${edu.school || 'School Name'}</p>
                ${edu.gpa ? `<p style="font-size: 12px; color: #6b7280;">GPA: ${edu.gpa}</p>` : ''}
              </div>
              ${edu.year ? `<span class="duration">${edu.year}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Skills -->
    ${resumeData.skills.length > 0 ? `
      <div class="resume-section">
        <h2 class="section-title">Skills</h2>
        <div class="skills-container">
          ${resumeData.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
      </div>
    ` : ''}
  </div>
</body>
</html>`;

    // Write to the new window
    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
        // Close the window after printing
        setTimeout(() => {
          try {
            printWindow.close();
          } catch (e) {
            // Ignore close errors
          }
        }, 1000);
        return true;
      } catch (e) {
        console.error('Print error:', e);
        try {
          printWindow.close();
        } catch (closeError) {
          // Ignore close errors
        }
        return false;
      }
    }, 500);

    return true;
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const opened = await openPrintDialogFromPreview();
      if (opened) {
        toast.info('Print dialog opened — Save as PDF. IMPORTANT: Turn OFF "Headers and footers" and turn ON "Background graphics" for a clean resume.');
      } else {
        toast.error("Unable to open print dialog. Please try again.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Unable to open print dialog. Please try again.");
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
    // Robust parsing: split by commas, semicolons, or newlines; trim; remove empties; dedupe (case-insensitive)
    const parts = skillsText
      .split(/[,\n;]+/)
      .map((s) => s.trim())
      .filter((s) => s !== "");
    const seen = new Set<string>();
    const unique: Array<string> = [];
    for (const s of parts) {
      const key = s.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(s);
      }
    }
    setResumeData((prev) => ({ ...prev, skills: unique }));
  };

  const handleRefineSummary = async () => {
    const text = resumeData.summary?.trim() || "";
    if (!text) {
      toast.error("Please write your summary before refining.");
      return;
    }
    try {
      setIsRefiningSummary(true);
      const refined = await refineTextAI({ text, context: "summary" });
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
      const refined = await refineTextAI({ text: current, context: "experience" });
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

  const applyStyle = (styleId: "classic" | "modern" | "minimal" | "technical" | "elegant" | "compact" | "creative" | "executive") => {
    setSelectedStyle(styleId);
    toast.success("Style applied!");
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
    return <AuthRedirect to="/auth" />;
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
                  Saving PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Save as PDF
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
              <TemplateLibrary onSelectStyle={applyStyle} selectedStyle={selectedStyle} />
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
              <PreviewPanel resumeData={resumeData} containerRef={previewRef} variant={selectedStyle} />
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
            <TemplateLibrary onSelectStyle={applyStyle} selectedStyle={selectedStyle} />
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
              <PreviewPanel resumeData={resumeData} containerRef={previewRef} variant={selectedStyle} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}