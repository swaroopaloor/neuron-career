import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  ArrowLeft, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  BrainCircuit,
  Download,
  Share,
  FileText,
  MessageSquare,
  Sparkles,
  Copy,
  Zap,
  Star
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import AnalysisLoading from "@/components/AnalysisLoading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { useMutation } from "convex/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AnalysisReportProps {
  analysisId: Id<"analyses">;
  onBack: () => void;
}

export default function AnalysisReport({ analysisId, onBack }: AnalysisReportProps) {
  const analysis = useQuery(api.analyses.getAnalysis, { id: analysisId });
  const setDreamJob = useMutation(api.analyses.setDreamJobAnalysis);

  // Single state for the active tab (Match or ATS)
  const [activeTab, setActiveTab] = useState<"match" | "ats">("match");
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [openMatchDialog, setOpenMatchDialog] = useState(false);
  const [openAtsDialog, setOpenAtsDialog] = useState(false);

  if (!analysis) {
    return <AnalysisLoading />;
  }

  // Process suggestions with proper section categorization
  const categorizeBySection = (suggestion: string): string => {
    const lower = suggestion.toLowerCase();
    if (lower.includes('summary') || lower.includes('objective') || lower.includes('profile')) return 'summary';
    if (lower.includes('skill') || lower.includes('technology') || lower.includes('programming')) return 'skills';
    if (lower.includes('experience') || lower.includes('work') || lower.includes('job') || lower.includes('role')) return 'experience';
    if (lower.includes('project') || lower.includes('portfolio')) return 'projects';
    if (lower.includes('education') || lower.includes('degree') || lower.includes('university')) return 'education';
    if (lower.includes('certification') || lower.includes('certificate')) return 'certifications';
    return 'summary'; // default
  };

  // Add: shared section labels used across formatting and UI
  const sectionLabels: Record<string, string> = {
    summary: "Summary",
    skills: "Skills",
    experience: "Experience",
    projects: "Projects",
    education: "Education",
    certifications: "Certifications",
  };

  const matchSuggestions = (analysis.matchingImprovements || []).map((suggestion, index) => ({
    id: index,
    text: suggestion,
    section: categorizeBySection(suggestion)
  }));

  const atsSuggestions = (analysis.atsImprovements || []).map((suggestion, index) => ({
    id: index,
    text: suggestion,
    section: categorizeBySection(suggestion)
  }));

  // Get current suggestions based on active tab
  const currentSuggestions = activeTab === "match" ? matchSuggestions : atsSuggestions;
  
  // Filter suggestions based on selected section
  const filteredSuggestions = sectionFilter === "all" 
    ? currentSuggestions 
    : currentSuggestions.filter(s => s.section === sectionFilter);

  // Add: group filtered suggestions by section to reduce item count
  const sectionOrder: Array<string> = ["summary", "skills", "experience", "projects", "education", "certifications"];
  const groupedBySection: Record<string, Array<string>> = {};
  for (const s of filteredSuggestions) {
    if (!groupedBySection[s.section]) groupedBySection[s.section] = [];
    groupedBySection[s.section].push(s.text);
  }
  const groupedSuggestions: Array<{ id: number; section: string; texts: Array<string> }> = sectionOrder
    .filter((sec) => groupedBySection[sec] && groupedBySection[sec].length > 0)
    .map((sec, idx) => ({ id: idx, section: sec, texts: groupedBySection[sec] }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-destructive";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-primary/10 border-primary/20";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    return "bg-destructive/10 border-destructive/20";
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  };

  // Update: use shared section labels for single-suggestion formatter (kept for other uses)
  const formatSuggestion = (sectionKey: string, suggestion: string, type: string) => {
    const label = sectionLabels[sectionKey] || "General";
    return `[${type} Improvement]\nSection: ${label}\nChange: ${suggestion}\n\nInstructions:\nUpdate the ${label} section of your resume to incorporate the above change in clear, concise bullet points.`;
  };

  // Add: formatter for grouped section suggestions
  const formatSectionGroup = (sectionKey: string, texts: Array<string>, type: string) => {
    const label = sectionLabels[sectionKey] || "General";
    const bullets = texts.map((t) => `- ${t}`).join("\n");
    return `[${type} Improvement]\nSection: ${label}\n\nAction Plan:\n${bullets}\n\nInstructions:\nUpdate the ${label} section of your resume using the above bullet points. Keep wording concise and achievement-oriented.`;
  };

  const handleToggleSuggestion = (suggestionId: number) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  // Update: select/deselect all based on grouped items
  const handleSelectAll = () => {
    if (selectedSuggestions.size === groupedSuggestions.length) {
      setSelectedSuggestions(new Set());
    } else {
      setSelectedSuggestions(new Set(groupedSuggestions.map(g => g.id)));
    }
  };

  // Update: copy only selected grouped items
  const handleCopySelected = async () => {
    if (selectedSuggestions.size === 0) {
      toast("No items selected");
      return;
    }
    
    const typeLabel = activeTab === "match" ? "Match" : "ATS";
    const selectedText = groupedSuggestions
      .filter(g => selectedSuggestions.has(g.id))
      .map(g => formatSectionGroup(g.section, g.texts, typeLabel))
      .join("\n\n");
    
    await handleCopy(selectedText);
  };

  // Update: copy all visible grouped items
  const handleCopyAll = async () => {
    if (groupedSuggestions.length === 0) {
      toast("Nothing to copy");
      return;
    }
    const typeLabel = activeTab === "match" ? "Match" : "ATS";
    const allText = groupedSuggestions
      .map(g => formatSectionGroup(g.section, g.texts, typeLabel))
      .join("\n\n");
    
    await handleCopy(allText);
  };

  // Reset selections when tab or filter changes
  const handleTabChange = (tab: "match" | "ats") => {
    setActiveTab(tab);
    setSelectedSuggestions(new Set());
  };

  const handleSectionFilterChange = (section: string) => {
    setSectionFilter(section);
    setSelectedSuggestions(new Set());
  };

  // Add: helpers for Share and Export functionality
  const groupTexts = (arr: Array<string>): Record<string, Array<string>> => {
    const out: Record<string, Array<string>> = {};
    for (const s of arr) {
      const sec = categorizeBySection(s);
      if (!out[sec]) out[sec] = [];
      out[sec].push(s);
    }
    return out;
  };

  const buildExportText = (): string => {
    const lines: Array<string> = [];
    lines.push("Resume Analysis Report");
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push("");
    lines.push(`Match Score: ${analysis.matchScore}%`);
    lines.push(`ATS Score: ${analysis.atsScore}%`);
    lines.push("");

    if (analysis.priorityImprovements && analysis.priorityImprovements.length) {
      lines.push("Priority Changes:");
      analysis.priorityImprovements.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
      lines.push("");
    }

    if (analysis.missingKeywords && analysis.missingKeywords.length) {
      lines.push("Missing Keywords:");
      lines.push(analysis.missingKeywords.map((k) => `- ${k}`).join("\n"));
      lines.push("");
    }

    const matchGrouped = groupTexts(analysis.matchingImprovements || []);
    const atsGrouped = groupTexts(analysis.atsImprovements || []);

    lines.push("Match Suggestions:");
    for (const sec of Object.keys(matchGrouped)) {
      lines.push(`- ${sectionLabels[sec] || sec}:`);
      for (const t of matchGrouped[sec]) lines.push(`  • ${t}`);
    }
    lines.push("");

    lines.push("ATS Suggestions:");
    for (const sec of Object.keys(atsGrouped)) {
      lines.push(`- ${sectionLabels[sec] || sec}:`);
      for (const t of atsGrouped[sec]) lines.push(`  • ${t}`);
    }
    lines.push("");

    if (analysis.topicsToMaster && analysis.topicsToMaster.length) {
      lines.push("Topics to Master:");
      analysis.topicsToMaster.forEach((t, i) => {
        lines.push(`${i + 1}. ${t.topic}`);
        if (t.description) lines.push(`   - ${t.description}`);
      });
      lines.push("");
    }

    if (analysis.interviewQuestions && analysis.interviewQuestions.length) {
      lines.push("Interview Questions:");
      analysis.interviewQuestions.forEach((q, i) => {
        lines.push(`${i + 1}. [${q.category}] ${q.question}`);
      });
      lines.push("");
    }

    if (analysis.interviewTalkingPoints && analysis.interviewTalkingPoints.length) {
      lines.push("Interview Talking Points:");
      analysis.interviewTalkingPoints.forEach((tp, i) => {
        lines.push(`${i + 1}. ${tp.point}`);
        if (tp.example) lines.push(`   e.g., ${tp.example}`);
      });
      lines.push("");
    }

    if (analysis.coverLetter) {
      lines.push("AI-Generated Cover Letter:");
      lines.push(analysis.coverLetter);
      lines.push("");
    }

    if (analysis.jobDescription) {
      lines.push("Original Job Description:");
      lines.push(analysis.jobDescription);
      lines.push("");
    }

    return lines.join("\n");
  };

  const handleShare = async () => {
    const priorities = (analysis.priorityImprovements || []).slice(0, 3);
    const shareText =
      `Resume Analysis\nMatch: ${analysis.matchScore}% | ATS: ${analysis.atsScore}%\n` +
      (priorities.length
        ? `Top priorities:\n${priorities.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
        : "Top priorities: None");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Resume Analysis", text: shareText });
        toast("Share dialog opened");
      } catch (err) {
        // Fallback to clipboard when sharing fails (except user abort)
        // @ts-expect-error name may not exist
        if (!err || err.name !== "AbortError") {
          await navigator.clipboard.writeText(shareText);
          toast("Copied summary to clipboard");
        }
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast("Copied summary to clipboard");
    }
  };

  const handleExport = () => {
    const content = buildExportText();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis-${String(analysisId)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Exported analysis as text file");
  };

  const handleSetDreamJob = async () => {
    try {
      await setDreamJob({ analysisId });
      toast("Set as dream job successfully! 🌟");
    } catch (error) {
      console.error("Failed to set dream job:", error);
      toast.error("Failed to set as dream job. Please try again.");
    }
  };

  const getMatchBreakdown = () => {
    const total = analysis.matchScore || 0;
    // Weights: Keywords & Skills 40%, Experience 40%, Education/Projects 20%
    const parts = [
      { key: "Keywords & Skills", weight: 0.4, reason: (() => {
        const missing = (analysis.missingKeywords || []).length;
        const skillsItems = (matchSuggestions.filter(s => s.section === "skills")).length;
        return missing > 0
          ? `Some role keywords are missing (${missing}); add them to Skills and relevant bullets.`
          : skillsItems > 0
            ? `Skills align well with the role; keep keywords prominent in bullets.`
            : `Add more role-specific keywords to Skills and throughout experience.`;
      })() },
      { key: "Experience Alignment", weight: 0.4, reason: (() => {
        const expItems = (matchSuggestions.filter(s => s.section === "experience")).length;
        return expItems > 0
          ? `Tighten role responsibilities and quantify outcomes in Experience.`
          : `Experience appears aligned; quantify results and mirror job terminology.`;
      })() },
      { key: "Education / Projects", weight: 0.2, reason: (() => {
        const eduItems = (matchSuggestions.filter(s => s.section === "education" || s.section === "projects")).length;
        return eduItems > 0
          ? `Highlight relevant education, certifications, and projects for this role.`
          : `Education and projects look adequate; ensure relevance is clear.`;
      })() },
    ] as const;

    return parts.map(p => ({
      label: p.key,
      percent: Math.round(total * p.weight),
      reason: p.reason,
    }));
  };

  const getAtsBreakdown = () => {
    const total = analysis.atsScore || 0;
    // Weights: Formatting 35%, Keyword Density 35%, Section Completeness 30%
    const parts = [
      { key: "Formatting Compliance", weight: 0.35, reason: `Use simple headings, consistent bullet style, and avoid tables/graphics for ATS.` },
      { key: "Keyword Density", weight: 0.35, reason: (() => {
        const missing = (analysis.missingKeywords || []).length;
        return missing > 0
          ? `Increase presence of missing keywords (${missing}) across Summary, Skills, and Experience.`
          : `Good keyword coverage; keep role terms naturally throughout your resume.`;
      })() },
      { key: "Section Completeness", weight: 0.30, reason: `Ensure Summary, Skills, Experience, and Education are present and clearly labeled.` },
    ] as const;

    return parts.map(p => ({
      label: p.key,
      percent: Math.round(total * p.weight),
      reason: p.reason,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="border-b bg-card elevation-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-medium text-foreground">Analysis Report</h1>
            
            <div className="ml-auto flex items-center gap-2">
              {analysis?.status === "completed" && (
                <Button
                  variant={analysis.isDreamJob ? "default" : "outline"}
                  size="sm"
                  onClick={handleSetDreamJob}
                  className={analysis.isDreamJob ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" : ""}
                >
                  <Star className={`h-4 w-4 mr-2 ${analysis.isDreamJob ? "fill-current" : ""}`} />
                  {analysis.isDreamJob ? "Dream Job ✨" : "Set as Dream Job"}
                </Button>
              )}
              <Button variant="outline" size="sm" className="px-2 sm:px-3" onClick={handleShare}>
                <Share className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button variant="outline" size="sm" className="px-2 sm:px-3" onClick={handleExport}>
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {/* Match Score */}
          <Card
            className="elevation-2 cursor-pointer hover:bg-accent/30 transition"
            onClick={() => setOpenMatchDialog(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Match Score
              </CardTitle>
              <CardDescription>
                How well your resume matches the job requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className={`text-center p-6 rounded-lg border ${getScoreBg(analysis.matchScore)}`}>
                  <div className={`text-4xl font-bold ${getScoreColor(analysis.matchScore)}`}>
                    {analysis.matchScore}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analysis.matchScore >= 80 ? "Excellent match!" : 
                     analysis.matchScore >= 60 ? "Good match" : "Needs improvement"}
                  </p>
                </div>
                <Progress value={analysis.matchScore} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* ATS Score */}
          <Card
            className="elevation-2 cursor-pointer hover:bg-accent/30 transition"
            onClick={() => setOpenAtsDialog(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                ATS Score
              </CardTitle>
              <CardDescription>
                How likely your resume is to pass Applicant Tracking Systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className={`text-center p-6 rounded-lg border ${getScoreBg(analysis.atsScore)}`}>
                  <div className={`text-4xl font-bold ${getScoreColor(analysis.atsScore)}`}>
                    {analysis.atsScore}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analysis.atsScore >= 80 ? "ATS-friendly!" : 
                     analysis.atsScore >= 60 ? "Mostly compatible" : "Needs optimization"}
                  </p>
                </div>
                <Progress value={analysis.atsScore} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Priority Changes Section */}
        {analysis.priorityImprovements && analysis.priorityImprovements.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="mb-8"
          >
            <Card className="elevation-2 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
              <Accordion type="single" collapsible>
                <AccordionItem value="priority">
                  <AccordionTrigger className="px-6 py-4">
                    <div className="text-left w-full">
                      <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                        <Zap className="h-5 w-5" />
                        <span className="font-semibold">Priority Changes</span>
                        <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          High Impact
                        </Badge>
                      </div>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        The most critical changes that will dramatically improve your resume's effectiveness
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-6">
                      <div className="space-y-4">
                        {analysis.priorityImprovements.map((improvement, index) => (
                          <motion.div
                            key={index}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 * index }}
                            className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900/50 rounded-lg border border-orange-200 dark:border-orange-800"
                          >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground font-medium leading-relaxed">
                                {improvement}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopy(improvement)}
                              className="flex-shrink-0 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/20"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}

                        <div className="flex items-center justify-between pt-4 border-t border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
                            <Star className="h-4 w-4" />
                            <span>Focus on these changes first for maximum impact</span>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCopy(analysis.priorityImprovements?.join('\n\n') || '')}
                            className="bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-900 dark:hover:bg-orange-800 dark:text-orange-200"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy All Priority Changes
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </motion.div>
        )}

        {/* Single Unified Improvement Suggestions Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <Card className="elevation-2">
            <Accordion type="single" collapsible>
              <AccordionItem value="improve">
                <AccordionTrigger className="px-6 py-4">
                  <div className="text-left w-full">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Improve Your Resume</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Targeted suggestions to enhance your resume's effectiveness
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-6 pb-6">
                    {/* Tab Toggle */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="inline-flex items-center rounded-lg bg-muted p-1">
                        <button
                          onClick={() => handleTabChange("match")}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === "match"
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Target className="h-4 w-4 mr-2 inline" />
                          Match Score Improvements
                        </button>
                        <button
                          onClick={() => handleTabChange("ats")}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === "ats"
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <TrendingUp className="h-4 w-4 mr-2 inline" />
                          ATS Score Improvements
                        </button>
                      </div>
                    </div>

                    {currentSuggestions.length > 0 ? (
                      <div className="space-y-6">
                        {/* Filter Controls */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <label className="text-sm font-medium">Filter by section:</label>
                            <Select value={sectionFilter} onValueChange={handleSectionFilterChange}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Sections</SelectItem>
                                <SelectItem value="summary">Summary</SelectItem>
                                <SelectItem value="skills">Skills</SelectItem>
                                <SelectItem value="experience">Experience</SelectItem>
                                <SelectItem value="projects">Projects</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="certifications">Certifications</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            Showing {groupedSuggestions.length} action item{groupedSuggestions.length === 1 ? "" : "s"}
                            {sectionFilter !== "all" && ` for ${sectionLabels[sectionFilter] || sectionFilter}`}
                          </div>
                        </div>

                        {/* Action Controls */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleSelectAll}
                            >
                              {selectedSuggestions.size === groupedSuggestions.length ? "Deselect All" : "Select All"}
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              {selectedSuggestions.size} of {groupedSuggestions.length} selected
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={handleCopySelected}
                              disabled={selectedSuggestions.size === 0}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Selected ({selectedSuggestions.size})
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={handleCopyAll}
                              disabled={groupedSuggestions.length === 0}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy All ({groupedSuggestions.length})
                            </Button>
                          </div>
                        </div>

                        {/* Suggestions List (grouped by section) */}
                        {groupedSuggestions.length > 0 ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {groupedSuggestions.map((group) => (
                              <div key={group.id} className="p-4 bg-muted/50 rounded-lg border">
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedSuggestions.has(group.id)}
                                    onChange={() => handleToggleSuggestion(group.id)}
                                    className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                  />
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-start gap-2">
                                      <Badge
                                        variant={activeTab === "match" ? "default" : "secondary"}
                                        className="text-xs"
                                      >
                                        {activeTab === "match" ? "Match" : "ATS"}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {group.section}
                                      </Badge>
                                    </div>

                                    <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
                                      {group.texts.map((t, i) => (
                                        <li key={i}>{t}</li>
                                      ))}
                                    </ul>

                                    <div className="flex items-center justify-end">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleCopy(
                                            formatSectionGroup(
                                              group.section,
                                              group.texts,
                                              activeTab === "match" ? "Match" : "ATS"
                                            )
                                          )
                                        }
                                      >
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">
                              No {activeTab === "match" ? "match" : "ATS"} suggestions found for the selected section.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No {activeTab === "match" ? "match" : "ATS"} improvement suggestions available.
                        </p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </motion.div>

        <Dialog open={openMatchDialog} onOpenChange={setOpenMatchDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Match Score Breakdown</DialogTitle>
              <DialogDescription>
                Why your match score is {analysis.matchScore}% and how to improve it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {getMatchBreakdown().map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-sm text-muted-foreground">{item.percent}%</span>
                  </div>
                  <Progress value={item.percent} />
                  <p className="text-sm text-muted-foreground">{item.reason}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openAtsDialog} onOpenChange={setOpenAtsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ATS Score Breakdown</DialogTitle>
              <DialogDescription>
                Why your ATS score is {analysis.atsScore}% and how to improve it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {getAtsBreakdown().map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-sm text-muted-foreground">{item.percent}%</span>
                  </div>
                  <Progress value={item.percent} />
                  <p className="text-sm text-muted-foreground">{item.reason}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Missing Keywords */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="elevation-2 h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Missing Keywords
                  </CardTitle>
                  <CardDescription>
                    Important keywords from the job description that are missing from your resume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.missingKeywords.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Great! No critical keywords are missing from your resume.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analysis.missingKeywords.map((keyword, index) => (
                        <motion.div
                          key={keyword}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <Badge
                            variant="outline"
                            className="text-sm py-2 px-3 bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200"
                          >
                            {keyword}
                          </Badge>
                        </motion.div>
                      ))}
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          💡 <strong>Tip:</strong> Consider incorporating these keywords naturally into your resume 
                          to improve your match score and ATS compatibility.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Topics to Master */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="elevation-2 h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    Topics to Master
                  </CardTitle>
                  <CardDescription>
                    Key areas to be well-versed in for the interview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.topicsToMaster && analysis.topicsToMaster.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {analysis.topicsToMaster.map((item, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                          <AccordionTrigger className="text-left hover:no-underline">
                            {item.topic}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {item.description}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No specific topics were identified for this role.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* AI Cover Letter */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="elevation-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    AI-Generated Cover Letter
                  </CardTitle>
                  <CardDescription>
                    A personalized draft to get you started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysis.coverLetter ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <div className="whitespace-pre-wrap text-sm">{analysis.coverLetter}</div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Cover letter could not be generated for this analysis.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Interview Prep Kit */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="elevation-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Interview Prep Kit
                  </CardTitle>
                  <CardDescription>
                    Likely questions and key talking points for your interview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full space-y-4">
                    {/* Interview Questions */}
                    <AccordionItem value="questions">
                      <AccordionTrigger className="text-lg font-medium">
                        Potential Questions
                      </AccordionTrigger>
                      <AccordionContent>
                        {analysis.interviewQuestions && analysis.interviewQuestions.length > 0 ? (
                          <ul className="space-y-3 mt-2">
                            {analysis.interviewQuestions.map((q, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <MessageSquare className="h-4 w-4 mt-1 text-primary" />
                                <div>
                                  <p className="font-medium">{q.question}</p>
                                  <Badge variant="outline" className="mt-1">{q.category}</Badge>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground">No questions generated.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Talking Points */}
                    <AccordionItem value="talking-points">
                      <AccordionTrigger className="text-lg font-medium">
                        Key Talking Points
                      </AccordionTrigger>
                      <AccordionContent>
                        {analysis.interviewTalkingPoints && analysis.interviewTalkingPoints.length > 0 ? (
                          <ul className="space-y-4 mt-2">
                            {analysis.interviewTalkingPoints.map((tp, i) => (
                              <li key={i} className="p-3 bg-muted/50 rounded-lg">
                                <p className="font-semibold text-foreground">{tp.point}</p>
                                <p className="text-sm text-muted-foreground mt-1 italic">
                                  <strong>Example:</strong> {tp.example}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground">No talking points generated.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Job Description */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="elevation-2">
            <CardHeader>
              <CardTitle>Original Job Description</CardTitle>
              <CardDescription>
                The job description used for this analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                  {analysis.jobDescription}
                </pre>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}