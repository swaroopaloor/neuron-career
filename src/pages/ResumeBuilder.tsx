import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
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
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  Edit3,
  Loader2,
  CheckCircle,
  User,
  Briefcase,
  GraduationCap,
  Award
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { GlobalHeader } from "@/components/GlobalHeader";

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    website?: string;
    linkedin?: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
    gpa?: string;
  }>;
  skills: string[];
}

const defaultResumeData: ResumeData = {
  personalInfo: { name: "", email: "", phone: "", location: "", website: "", linkedin: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
};

export default function ResumeBuilder() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const savedResume = useQuery(api.resumes.getUserResume);
  const saveResume = useMutation(api.resumes.saveResume);

  // Load saved resume data
  useEffect(() => {
    if (savedResume) {
      try {
        const parsedData = JSON.parse(savedResume.content);
        setResumeData(parsedData);
      } catch (error) {
        console.error("Failed to parse saved resume:", error);
      }
    } else if (user) {
      // Pre-fill with user data
      setResumeData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          name: user.name || "",
          email: user.email || "",
        }
      }));
    }
  }, [savedResume, user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveResume({
        title: `${resumeData.personalInfo.name || "My"} Resume`,
        content: JSON.stringify(resumeData),
      });
      setLastSaved(new Date());
      toast.success("Resume saved successfully!");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save resume. Please try again.");
    } finally {
      setIsSaving(false);
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

  const ResumePreview = () => (
    <div className="bg-white text-black p-8 shadow-lg rounded-lg min-h-[800px] max-w-[8.5in] mx-auto">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {resumeData.personalInfo.name || "Your Name"}
        </h1>
        <div className="text-sm text-gray-600 space-y-1">
          {resumeData.personalInfo.email && <p>{resumeData.personalInfo.email}</p>}
          {resumeData.personalInfo.phone && <p>{resumeData.personalInfo.phone}</p>}
          {resumeData.personalInfo.location && <p>{resumeData.personalInfo.location}</p>}
          {resumeData.personalInfo.website && <p>{resumeData.personalInfo.website}</p>}
          {resumeData.personalInfo.linkedin && <p>{resumeData.personalInfo.linkedin}</p>}
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
                <p className="text-sm font-medium text-gray-700 mb-2">{exp.company || "Company Name"}</p>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Global Header for consistent navigation */}
      <GlobalHeader />

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
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Resume
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
              <ResumeEditor />
            </TabsContent>
            
            <TabsContent value="preview">
              <ResumePreview />
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
            <ResumeEditor />
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
              <ResumePreview />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );

  function ResumeEditor() {
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
                  onChange={(e) => updatePersonalInfo('name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  placeholder="City, State"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={resumeData.personalInfo.website || ""}
                  onChange={(e) => updatePersonalInfo('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={resumeData.personalInfo.linkedin || ""}
                  onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/yourprofile"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[120px] resize-none"
              value={resumeData.summary}
              onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
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
                      onChange={(e) => updateExperience(index, 'title', e.target.value)}
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div>
                    <Label>Company *</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      placeholder="Tech Corp"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Duration</Label>
                  <Input
                    value={exp.duration}
                    onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                    placeholder="Jan 2020 - Present"
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    className="min-h-[100px] resize-none"
                    value={exp.description}
                    onChange={(e) => updateExperience(index, 'description', e.target.value)}
                    placeholder="• Describe your key responsibilities and achievements&#10;• Use bullet points for better readability&#10;• Include quantifiable results when possible"
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
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      placeholder="Bachelor of Science in Computer Science"
                    />
                  </div>
                  <div>
                    <Label>School *</Label>
                    <Input
                      value={edu.school}
                      onChange={(e) => updateEducation(index, 'school', e.target.value)}
                      placeholder="University Name"
                    />
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Input
                      value={edu.year}
                      onChange={(e) => updateEducation(index, 'year', e.target.value)}
                      placeholder="2020"
                    />
                  </div>
                  <div>
                    <Label>GPA (Optional)</Label>
                    <Input
                      value={edu.gpa || ""}
                      onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
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
                value={resumeData.skills.join(', ')}
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
}