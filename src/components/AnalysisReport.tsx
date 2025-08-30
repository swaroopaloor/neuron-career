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
  Copy
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import AnalysisLoading from "@/components/AnalysisLoading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";

interface AnalysisReportProps {
  analysisId: Id<"analyses">;
  onBack: () => void;
}

export default function AnalysisReport({ analysisId, onBack }: AnalysisReportProps) {
  const analysis = useQuery(api.analyses.getAnalysis, { id: analysisId });

  // Separate state for match and ATS suggestions
  const [matchSelectedSuggestions, setMatchSelectedSuggestions] = useState<Set<number>>(new Set());
  const [atsSelectedSuggestions, setAtsSelectedSuggestions] = useState<Set<number>>(new Set());
  const [matchSectionFilter, setMatchSectionFilter] = useState<string>("all");
  const [atsSectionFilter, setAtsSectionFilter] = useState<string>("all");

  if (!analysis) {
    return <AnalysisLoading />;
  }

  // Separate match and ATS suggestions with section assignments
  const matchSuggestions = (analysis.matchingImprovements || []).map((suggestion, index) => ({
    id: index,
    text: suggestion,
    section: "summary" // Default section
  }));

  const atsSuggestions = (analysis.atsImprovements || []).map((suggestion, index) => ({
    id: index,
    text: suggestion,
    section: "summary" // Default section
  }));

  // Filter suggestions based on selected sections
  const filteredMatchSuggestions = matchSectionFilter === "all" 
    ? matchSuggestions 
    : matchSuggestions.filter(s => s.section === matchSectionFilter);

  const filteredAtsSuggestions = atsSectionFilter === "all" 
    ? atsSuggestions 
    : atsSuggestions.filter(s => s.section === atsSectionFilter);

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

  const formatSuggestion = (sectionKey: string, suggestion: string, type: string) => {
    const sectionMap: Record<string, string> = {
      summary: "Summary",
      skills: "Skills", 
      experience: "Experience",
      projects: "Projects",
      education: "Education",
      certifications: "Certifications",
    };
    const label = sectionMap[sectionKey] || "General";
    return `[${type} Improvement]\nSection: ${label}\nChange: ${suggestion}\n\nInstructions:\nUpdate the ${label} section of your resume to incorporate the above change in clear, concise bullet points.`;
  };

  // Match suggestions handlers
  const handleToggleMatchSuggestion = (suggestionId: number) => {
    setMatchSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const handleSelectAllMatch = () => {
    if (matchSelectedSuggestions.size === filteredMatchSuggestions.length) {
      setMatchSelectedSuggestions(new Set());
    } else {
      setMatchSelectedSuggestions(new Set(filteredMatchSuggestions.map(s => s.id)));
    }
  };

  const handleCopySelectedMatch = async () => {
    if (matchSelectedSuggestions.size === 0) {
      toast("No suggestions selected");
      return;
    }
    
    const selectedText = filteredMatchSuggestions
      .filter(s => matchSelectedSuggestions.has(s.id))
      .map(s => formatSuggestion(s.section, s.text, "Match"))
      .join("\n\n");
    
    await handleCopy(selectedText);
  };

  const handleCopyAllMatch = async () => {
    const allText = filteredMatchSuggestions
      .map(s => formatSuggestion(s.section, s.text, "Match"))
      .join("\n\n");
    
    await handleCopy(allText);
  };

  // ATS suggestions handlers
  const handleToggleAtsSuggestion = (suggestionId: number) => {
    setAtsSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const handleSelectAllAts = () => {
    if (atsSelectedSuggestions.size === filteredAtsSuggestions.length) {
      setAtsSelectedSuggestions(new Set());
    } else {
      setAtsSelectedSuggestions(new Set(filteredAtsSuggestions.map(s => s.id)));
    }
  };

  const handleCopySelectedAts = async () => {
    if (atsSelectedSuggestions.size === 0) {
      toast("No suggestions selected");
      return;
    }
    
    const selectedText = filteredAtsSuggestions
      .filter(s => atsSelectedSuggestions.has(s.id))
      .map(s => formatSuggestion(s.section, s.text, "ATS"))
      .join("\n\n");
    
    await handleCopy(selectedText);
  };

  const handleCopyAllAts = async () => {
    const allText = filteredAtsSuggestions
      .map(s => formatSuggestion(s.section, s.text, "ATS"))
      .join("\n\n");
    
    await handleCopy(allText);
  };

  const updateMatchSuggestionSection = (suggestionId: number, section: string) => {
    const suggestionIndex = matchSuggestions.findIndex(s => s.id === suggestionId);
    if (suggestionIndex !== -1) {
      matchSuggestions[suggestionIndex].section = section;
    }
  };

  const updateAtsSuggestionSection = (suggestionId: number, section: string) => {
    const suggestionIndex = atsSuggestions.findIndex(s => s.id === suggestionId);
    if (suggestionIndex !== -1) {
      atsSuggestions[suggestionIndex].section = section;
    }
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
              <Button variant="outline" size="sm" className="px-2 sm:px-3">
                <Share className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button variant="outline" size="sm" className="px-2 sm:px-3">
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
          <Card className="elevation-2">
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
          <Card className="elevation-2">
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

        {/* Improvement Suggestions - Two Separate Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Match Score Improvements */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="elevation-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Improve Match Score
                </CardTitle>
                <CardDescription>
                  Suggestions to better align your resume with job requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matchSuggestions.length > 0 ? (
                  <div className="space-y-6">
                    {/* Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium">Filter by section:</label>
                        <Select value={matchSectionFilter} onValueChange={setMatchSectionFilter}>
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
                        Showing {filteredMatchSuggestions.length} suggestions
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSelectAllMatch}
                        >
                          {matchSelectedSuggestions.size === filteredMatchSuggestions.length ? "Deselect All" : "Select All"}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {matchSelectedSuggestions.size} of {filteredMatchSuggestions.length} selected
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleCopySelectedMatch}
                          disabled={matchSelectedSuggestions.size === 0}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Selected ({matchSelectedSuggestions.size})
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleCopyAllMatch}
                          disabled={filteredMatchSuggestions.length === 0}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy All ({filteredMatchSuggestions.length})
                        </Button>
                      </div>
                    </div>

                    {/* Suggestions List */}
                    {filteredMatchSuggestions.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredMatchSuggestions.map((suggestion) => (
                          <div key={suggestion.id} className="p-4 bg-muted/50 rounded-lg border">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={matchSelectedSuggestions.has(suggestion.id)}
                                onChange={() => handleToggleMatchSuggestion(suggestion.id)}
                                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start gap-2">
                                  <Badge variant="default" className="text-xs">
                                    Match
                                  </Badge>
                                  <span className="text-sm text-foreground flex-1">{suggestion.text}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={suggestion.section}
                                    onValueChange={(val) => updateMatchSuggestionSection(suggestion.id, val)}
                                  >
                                    <SelectTrigger className="h-8 w-[160px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="summary">Summary</SelectItem>
                                      <SelectItem value="skills">Skills</SelectItem>
                                      <SelectItem value="experience">Experience</SelectItem>
                                      <SelectItem value="projects">Projects</SelectItem>
                                      <SelectItem value="education">Education</SelectItem>
                                      <SelectItem value="certifications">Certifications</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleCopy(formatSuggestion(suggestion.section, suggestion.text, "Match"))
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
                          No suggestions found for the selected section.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No match improvement suggestions available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ATS Score Improvements */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="elevation-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Improve ATS Score
                </CardTitle>
                <CardDescription>
                  Suggestions to optimize your resume for ATS systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                {atsSuggestions.length > 0 ? (
                  <div className="space-y-6">
                    {/* Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium">Filter by section:</label>
                        <Select value={atsSectionFilter} onValueChange={setAtsSectionFilter}>
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
                        Showing {filteredAtsSuggestions.length} suggestions
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSelectAllAts}
                        >
                          {atsSelectedSuggestions.size === filteredAtsSuggestions.length ? "Deselect All" : "Select All"}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {atsSelectedSuggestions.size} of {filteredAtsSuggestions.length} selected
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleCopySelectedAts}
                          disabled={atsSelectedSuggestions.size === 0}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Selected ({atsSelectedSuggestions.size})
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleCopyAllAts}
                          disabled={filteredAtsSuggestions.length === 0}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy All ({filteredAtsSuggestions.length})
                        </Button>
                      </div>
                    </div>

                    {/* Suggestions List */}
                    {filteredAtsSuggestions.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredAtsSuggestions.map((suggestion) => (
                          <div key={suggestion.id} className="p-4 bg-muted/50 rounded-lg border">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={atsSelectedSuggestions.has(suggestion.id)}
                                onChange={() => handleToggleAtsSuggestion(suggestion.id)}
                                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    ATS
                                  </Badge>
                                  <span className="text-sm text-foreground flex-1">{suggestion.text}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={suggestion.section}
                                    onValueChange={(val) => updateAtsSuggestionSection(suggestion.id, val)}
                                  >
                                    <SelectTrigger className="h-8 w-[160px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="summary">Summary</SelectItem>
                                      <SelectItem value="skills">Skills</SelectItem>
                                      <SelectItem value="experience">Experience</SelectItem>
                                      <SelectItem value="projects">Projects</SelectItem>
                                      <SelectItem value="education">Education</SelectItem>
                                      <SelectItem value="certifications">Certifications</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleCopy(formatSuggestion(suggestion.section, suggestion.text, "ATS"))
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
                          No suggestions found for the selected section.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No ATS improvement suggestions available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

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