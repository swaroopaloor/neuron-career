import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ResumeEditor } from "@/components/ResumeEditor";
import { AIFeedback } from "@/components/AIFeedback";
import { TemplateLibrary } from "@/components/TemplateLibrary";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Save, Plus, FileText, Trash2, Edit3 } from "lucide-react";
import { motion } from "framer-motion";

export default function ResumeBuilder() {
  const { user } = useAuth();
  const [selectedResumeId, setSelectedResumeId] = useState<Id<"resumes"> | null>(null);
  const [resumeContent, setResumeContent] = useState("");
  const [resumeTitle, setResumeTitle] = useState("");
  const [isNewResumeDialogOpen, setIsNewResumeDialogOpen] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  const resumes = useQuery(api.resumes.listResumes);
  const selectedResume = useQuery(
    api.resumes.getResume,
    selectedResumeId ? { resumeId: selectedResumeId } : "skip"
  );

  const createResume = useMutation(api.resumes.createResume);
  const updateResume = useMutation(api.resumes.updateResume);
  const deleteResume = useMutation(api.resumes.deleteResume);
  const generateSuggestions = useAction(api.aiResumeProcessor.generateSuggestions);

  // Load selected resume data
  useEffect(() => {
    if (selectedResume) {
      setResumeContent(selectedResume.content);
      setResumeTitle(selectedResume.title);
    }
  }, [selectedResume]);

  // Auto-select first resume if none selected
  useEffect(() => {
    if (resumes && resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0]._id);
    }
  }, [resumes, selectedResumeId]);

  const handleCreateResume = async () => {
    if (!newResumeTitle.trim()) {
      toast.error("Please enter a resume title");
      return;
    }

    try {
      const resumeId = await createResume({
        title: newResumeTitle,
      });
      setSelectedResumeId(resumeId);
      setNewResumeTitle("");
      setIsNewResumeDialogOpen(false);
      toast.success("Resume created successfully!");
    } catch (error) {
      toast.error("Failed to create resume");
    }
  };

  const handleSaveResume = useCallback(async () => {
    if (!selectedResumeId) return;

    try {
      await updateResume({
        resumeId: selectedResumeId,
        title: resumeTitle,
        content: resumeContent,
      });
      toast.success("Resume saved successfully!");
    } catch (error) {
      toast.error("Failed to save resume");
    }
  }, [selectedResumeId, resumeTitle, resumeContent, updateResume]);

  const handleDeleteResume = async (resumeId: Id<"resumes">) => {
    try {
      await deleteResume({ resumeId });
      if (selectedResumeId === resumeId) {
        setSelectedResumeId(null);
      }
      toast.success("Resume deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete resume");
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!resumeContent) {
      toast.error("Please add some content to your resume first");
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const result = await generateSuggestions({
        resumeContent,
      });

      if (result.success) {
        setAiSuggestions(result.suggestions);
        toast.success("AI suggestions generated!");
      } else {
        toast.error(result.error || "Failed to generate suggestions");
      }
    } catch (error) {
      toast.error("Failed to generate AI suggestions");
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleSelectTemplate = (template: any) => {
    setResumeContent(JSON.stringify(template.content));
    toast.success(`${template.name} template applied!`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardTitle className="mb-4">Authentication Required</CardTitle>
          <p className="text-muted-foreground">Please sign in to access the resume builder.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Resume Builder</h1>
          <p className="text-muted-foreground">
            Create and optimize your resume with AI-powered suggestions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Resume List Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">My Resumes</CardTitle>
                <Dialog open={isNewResumeDialogOpen} onOpenChange={setIsNewResumeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Resume</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Input
                          placeholder="Resume title (e.g., Software Engineer Resume)"
                          value={newResumeTitle}
                          onChange={(e) => setNewResumeTitle(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleCreateResume} className="flex-1">
                          Create Resume
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsNewResumeDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-2">
                {resumes?.map((resume) => (
                  <div
                    key={resume._id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedResumeId === resume._id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedResumeId(resume._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium text-sm">{resume.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteResume(resume._id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Modified {new Date(resume.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {resumes?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No resumes yet. Create your first one!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Template Library */}
            <div className="mt-6">
              <TemplateLibrary onSelectTemplate={handleSelectTemplate} />
            </div>
          </motion.div>

          {/* Main Editor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            {selectedResumeId ? (
              <div className="space-y-6">
                {/* Resume Title and Save */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <Input
                          value={resumeTitle}
                          onChange={(e) => setResumeTitle(e.target.value)}
                          placeholder="Resume title"
                          className="text-lg font-semibold"
                        />
                      </div>
                      <Button onClick={handleSaveResume}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Resume Editor */}
                <ResumeEditor
                  content={resumeContent}
                  onChange={setResumeContent}
                />
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Edit3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <CardTitle className="mb-2">No Resume Selected</CardTitle>
                <p className="text-muted-foreground mb-4">
                  Create a new resume or select an existing one to start editing
                </p>
                <Button onClick={() => setIsNewResumeDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Resume
                </Button>
              </Card>
            )}
          </motion.div>

          {/* AI Feedback Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <AIFeedback
              suggestions={aiSuggestions}
              isLoading={isGeneratingSuggestions}
              onGenerateSuggestions={handleGenerateSuggestions}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
