import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Star, 
  BookOpen, 
  Briefcase, 
  Zap,
  Clock,
  Sparkles,
  GraduationCap,
  Code,
  Users,
  Loader2,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function DreamJob() {
  const dreamJobAnalysis = useQuery(api.analyses.getDreamJobAnalysis);
  const generateInsights = useAction(api.aiCareerGrowth.generateGrowthInsights);
  const generateCareerPlan = useAction(api.aiCareerGrowth.generateCareerPlan);
  const saveCompletedWeeks = useMutation(api.analyses.updateCompletedWeeks);
  const saveCareerPlan = useMutation(api.analyses.saveCareerPlan);

  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Roadmap generator form state
  const [about, setAbout] = useState("");
  const [dreamRole, setDreamRole] = useState("");
  const [weeks, setWeeks] = useState<number>(12);
  const [currentLevel, setCurrentLevel] = useState("Mid");
  const [yearsExperience, setYearsExperience] = useState<number>(3);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(8);

  // Generated plan state
  const [plan, setPlan] = useState<{
    topics: string[];
    courses: Array<{ title: string; provider: string; url: string }>;
    certifications: string[];
    timeline: Array<{ week: number; focus: string }>;
    summary: string;
  } | null>(null);

  // Add: progress state for weekly completion
  const [completedWeeks, setCompletedWeeks] = useState<Set<number>>(new Set());
  const [showCongrats, setShowCongrats] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);

  const motivationalMessages = [
    "Nice work! Every week compounds 🚀",
    "Great momentum! Keep going 💪",
    "You're building real skills. Onwards! 🌟",
    "Another step closer to your dream role 🎯",
    "Consistency wins. Proud of you! 🧠",
  ] as const;
  const [motivationText, setMotivationText] = useState<string>("");

  // Add: stable ref and jump handler placed before any early returns to keep hook order consistent
  const generatorRef = useRef<HTMLButtonElement | null>(null);
  const handleJumpToGenerator = () => {
    generatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Keyed storage for progress by analysis id
  const progressKey = dreamJobAnalysis ? `dreamProgress:${dreamJobAnalysis._id}` : null;

  // Add: derived metrics for hero summary
  const totalWeeks = (plan?.timeline?.length ?? (Number(weeks) || 0));
  const doneCount = completedWeeks.size;
  const remainingCount = Math.max(0, totalWeeks - doneCount);
  const nextWeekNumber = plan?.timeline
    ? plan.timeline.find((w) => !completedWeeks.has(w.week))?.week ?? null
    : null;
  const nextFocusText =
    nextWeekNumber && plan
      ? plan.timeline.find((w) => w.week === nextWeekNumber)?.focus ?? ""
      : "";
  const progressPercent = totalWeeks > 0 ? Math.min(100, Math.round((doneCount / totalWeeks) * 100)) : 0;
  const statusLabel = dreamJobAnalysis ? (dreamJobAnalysis.status.charAt(0).toUpperCase() + dreamJobAnalysis.status.slice(1)) : "—";

  // Prefer server-saved progress if available
  useEffect(() => {
    if (!dreamJobAnalysis) return;
    if (Array.isArray(dreamJobAnalysis.completedWeeks) && dreamJobAnalysis.completedWeeks.length >= 0) {
      setCompletedWeeks(new Set(dreamJobAnalysis.completedWeeks));
      // sync to local cache as well
      const key = `dreamProgress:${dreamJobAnalysis._id}`;
      localStorage.setItem(key, JSON.stringify(dreamJobAnalysis.completedWeeks));
    }
    // Load persisted roadmap automatically if available
    if (dreamJobAnalysis.careerPlan) {
      setPlan(dreamJobAnalysis.careerPlan);
    }
  }, [dreamJobAnalysis]);

  // Load saved progress on mount or when plan changes
  useEffect(() => {
    if (!plan || !progressKey) return;
    try {
      const raw = localStorage.getItem(progressKey);
      if (raw) {
        const arr: number[] = JSON.parse(raw);
        setCompletedWeeks(new Set(arr));
      } else {
        setCompletedWeeks(new Set());
      }
    } catch {
      setCompletedWeeks(new Set());
    }
  }, [plan, progressKey]);

  // Helper: save progress
  const saveProgress = (next: Set<number>) => {
    if (!progressKey) return;
    const arr = Array.from(next.values()).sort((a, b) => a - b);
    localStorage.setItem(progressKey, JSON.stringify(arr));
  };

  // Toggle a week's completion
  const toggleWeek = (weekNumber: number) => {
    setCompletedWeeks(prev => {
      const next = new Set(prev);
      const wasDone = next.has(weekNumber);
      if (wasDone) next.delete(weekNumber);
      else next.add(weekNumber);
      saveProgress(next);

      // Show motivational popup when a week transitions to done
      if (!wasDone) {
        const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        setMotivationText(msg);
        setShowMotivation(true);
      }

      // Trigger celebration if all completed
      const total = plan?.timeline?.length || 0;
      if (total > 0 && next.size === total) {
        setShowCongrats(true);
        toast("Amazing! You've completed your roadmap 🎉");
      }
      return next;
    });
  };

  // Reset progress
  const resetProgress = () => {
    setCompletedWeeks(new Set());
    if (progressKey) localStorage.removeItem(progressKey);
    toast("Progress reset");
  };

  const handleSaveProgress = async () => {
    if (!dreamJobAnalysis) return;
    try {
      const weeks = Array.from(completedWeeks.values()).sort((a, b) => a - b);
      await saveCompletedWeeks({ analysisId: dreamJobAnalysis._id, completedWeeks: weeks });
      toast("Progress saved to your account ✔️");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save progress. Please try again.");
    }
  };

  const handleGenerateInsights = async () => {
    if (!dreamJobAnalysis) return;

    setIsGeneratingInsights(true);
    try {
      // Get resume content from storage
      const resumeUrl = await fetch(`/api/storage/${dreamJobAnalysis.resumeFileId}`);
      const resumeContent = await resumeUrl.text();

      await generateInsights({
        resumeContent,
        jobDescription: dreamJobAnalysis.jobDescription,
        analysisId: dreamJobAnalysis._id,
      });

      toast("Growth insights generated successfully! 🚀");
    } catch (error) {
      console.error("Failed to generate insights:", error);
      toast.error("Failed to generate insights. Please try again.");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!dreamJobAnalysis) return;
    setIsGeneratingPlan(true);
    try {
      const roleGuess =
        dreamRole.trim() ||
        (dreamJobAnalysis.jobDescription.split("\n")[0]?.slice(0, 80) ?? "Dream Role");
      const result = await generateCareerPlan({
        about,
        dreamRole: roleGuess,
        weeks: Math.max(1, Math.min(52, Number(weeks) || 1)),
        currentLevel,
        yearsExperience: Math.max(0, Number(yearsExperience) || 0),
        hoursPerWeek: Math.max(1, Math.min(80, Number(hoursPerWeek) || 1)),
      });
      setPlan(result);
      // Persist roadmap so user doesn't need to regenerate next time
      try {
        await saveCareerPlan({
          analysisId: dreamJobAnalysis._id,
          careerPlan: result,
        });
      } catch {
        // if saving the plan fails, we still show it locally
      }
      toast("Career roadmap generated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate career roadmap.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const hasInsights = dreamJobAnalysis?.lackingSkills || dreamJobAnalysis?.lackingEducation || dreamJobAnalysis?.lackingExperience || dreamJobAnalysis?.growthPlan;

  if (dreamJobAnalysis === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your dream job...</p>
        </div>
      </div>
    );
  }

  if (!dreamJobAnalysis) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <Star className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Your Dream Job Awaits
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Set a dream job to get personalized insights on the skills, education, and experience you need to land your perfect role.
            </p>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                To get started, analyze a resume against a job description and mark it as your dream job.
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Link to="/dashboard">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Analysis
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // moved: generatorRef and handleJumpToGenerator are declared above to maintain consistent hook order

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-white fill-current" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Dream Job Analysis</h1>
            </div>
            
            <div className="ml-auto">
              {!hasInsights && (
                <Button
                  onClick={handleGenerateInsights}
                  disabled={isGeneratingInsights}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isGeneratingInsights ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Insights...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Growth Insights
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* New: Hero summary banner */}
      <section className="border-b bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
                <Star className="h-4 w-4" />
                Dream Job Analysis
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Your personalized path to the next role
              </h2>
              <p className="text-white/80 text-sm">
                Analyzed on {new Date(dreamJobAnalysis._creationTime).toLocaleDateString()} • Status: {statusLabel}
              </p>
            </div>

            <div className="w-full lg:w-[520px] rounded-xl bg-white/10 backdrop-blur p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/90">Roadmap Progress</span>
                <span className="text-white/90">
                  {totalWeeks ? `${doneCount}/${totalWeeks} weeks` : "No roadmap yet"}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white/90 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-lg bg-white/10 px-2 py-2">
                  <div className="font-semibold">{dreamJobAnalysis.matchScore || 0}%</div>
                  <div className="text-white/80">Match</div>
                </div>
                <div className="rounded-lg bg-white/10 px-2 py-2">
                  <div className="font-semibold">{dreamJobAnalysis.atsScore || 0}%</div>
                  <div className="text-white/80">ATS</div>
                </div>
                <div className="rounded-lg bg-white/10 px-2 py-2">
                  <div className="font-semibold">{progressPercent}%</div>
                  <div className="text-white/80">Progress</div>
                </div>
              </div>
            </div>
          </div>

          {/* Add: Next step + Quick actions row */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="col-span-2 rounded-xl bg-white/10 backdrop-blur p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-white/80">Next action</div>
                  <div className="mt-1 font-medium">
                    {plan && nextWeekNumber
                      ? `Week ${nextWeekNumber}:`
                      : plan
                      ? "All caught up!"
                      : "Generate your roadmap to get started"}
                  </div>
                  <div className="mt-1 text-sm text-white/80 line-clamp-2">
                    {plan && nextWeekNumber ? nextFocusText : plan ? "Consider going deeper or adding stretch goals." : "Open the generator to create a personalized plan."}
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
                  {remainingCount > 0 ? `${remainingCount} weeks left` : "Complete"}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur p-3 flex items-center justify-between gap-2">
              <div className="text-sm">
                <div className="text-white/80">Momentum</div>
                <div className="font-medium">{doneCount} completed • {remainingCount} to go</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" className="bg-white text-purple-700 hover:bg-white/90" onClick={handleSaveProgress}>
                  Save Progress
                </Button>
                <Button size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/10" onClick={handleJumpToGenerator}>
                  Edit Plan
                </Button>
                {!hasInsights && (
                  <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" onClick={handleGenerateInsights} disabled={isGeneratingInsights}>
                    {isGeneratingInsights ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Working</> : <>Generate Insights</>}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={showMotivation} onOpenChange={setShowMotivation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nice Progress! ✨</DialogTitle>
            <DialogDescription>{motivationText}</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Small steps every week add up to big outcomes. You've got this.
          </div>
          <DialogFooter>
            <Button onClick={() => setShowMotivation(false)}>Keep Going</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Congratulations! 🎉</DialogTitle>
            <DialogDescription>
              You've completed every week of your roadmap. That's huge.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-foreground font-medium">Recommended next steps:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Consolidate learnings into a showcase project or case study</li>
              <li>Update your resume with quantified outcomes from this journey</li>
              <li>Publish a short write-up on LinkedIn or personal site</li>
              <li>Target roles that highlight these skills and apply this week</li>
              <li>Schedule mock interviews and refine answers</li>
            </ul>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCongrats(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowCongrats(false);
                // small nudge to reset for another iteration
                toast("Set a new target or iterate to go deeper 🚀");
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              What's next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dream Job Header - now collapsible */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button
              ref={generatorRef}
              className="w-full group flex items-center justify-between rounded-xl border px-5 py-3 bg-card/70 hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
            >
              <span className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                Dream Job Setup & Roadmap Generator
              </span>
              <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="elevation-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800 mt-4">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl text-purple-900 dark:text-purple-100 mb-2">
                      Your Dream Job
                    </CardTitle>
                    <CardDescription className="text-purple-700 dark:text-purple-300">
                      Based on your analysis from {new Date(dreamJobAnalysis._creationTime).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Dream Job ✨
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Generator form */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Dream Role</Label>
                        <Input
                          placeholder="e.g., Senior Backend Engineer"
                          value={dreamRole}
                          onChange={(e) => setDreamRole(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Current Level</Label>
                        <Select value={currentLevel} onValueChange={setCurrentLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Junior">Junior</SelectItem>
                            <SelectItem value="Mid">Mid</SelectItem>
                            <SelectItem value="Senior">Senior</SelectItem>
                            <SelectItem value="Lead">Lead</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Years of Experience</Label>
                        <Input
                          type="number"
                          min={0}
                          value={yearsExperience}
                          onChange={(e) => setYearsExperience(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hours per Week</Label>
                        <Input
                          type="number"
                          min={1}
                          max={80}
                          value={hoursPerWeek}
                          onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (weeks)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={52}
                          value={weeks}
                          onChange={(e) => setWeeks(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>About you (optional)</Label>
                        <Textarea
                          rows={3}
                          placeholder="Briefly describe your background, stack, and target domain."
                          value={about}
                          onChange={(e) => setAbout(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleGeneratePlan}
                        disabled={isGeneratingPlan}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {isGeneratingPlan ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating Career Roadmap...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Career Roadmap
                          </>
                        )}
                      </Button>

                      {!hasInsights && (
                        <Button
                          variant="secondary"
                          onClick={handleGenerateInsights}
                          disabled={isGeneratingInsights}
                        >
                          {isGeneratingInsights ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating Growth Insights...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Generate Gap Insights
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress summary */}
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Track your weekly completion and see your progress toward the goal
                    </div>
                    <div className="rounded-lg border bg-card p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm">
                          {plan?.timeline?.length
                            ? `${completedWeeks.size} of ${plan.timeline.length} weeks completed`
                            : `0 of ${weeks} weeks completed`}
                        </div>
                        <Button variant="outline" size="sm" onClick={resetProgress}>
                          Reset
                        </Button>
                      </div>
                      <Progress
                        value={
                          plan?.timeline?.length
                            ? (completedWeeks.size / plan.timeline.length) * 100
                            : 0
                        }
                        className="h-2.5"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Stay consistent. Check off each week as you complete it.
                    </div>
                  </div>
                </div>

                {plan?.summary && (
                  <div className="mt-8 p-5 rounded-md bg-muted/40 text-sm leading-relaxed">
                    {plan.summary}
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {hasInsights ? (
          <div className="space-y-8 mt-8">
            {/* Gap Analysis - collapsible */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button className="w-full group flex items-center justify-between rounded-xl border px-5 py-3 bg-card/70 hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm">
                  <span className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-orange-500" />
                    Gap Analysis
                  </span>
                  <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Lacking Skills */}
                  <Card className="elevation-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Code className="h-5 w-5 text-blue-500" />
                        Skills to Develop
                      </CardTitle>
                      <CardDescription>
                        Technical and soft skills you need to acquire
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dreamJobAnalysis.lackingSkills && dreamJobAnalysis.lackingSkills.length > 0 ? (
                        <div className="space-y-2">
                          {dreamJobAnalysis.lackingSkills.map((skill, index) => (
                            <motion.div
                              key={skill}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.1 * index }}
                            >
                              <Badge variant="outline" className="w-full justify-start p-3 text-sm">
                                {skill}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No skill gaps identified
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Lacking Education */}
                  <Card className="elevation-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <GraduationCap className="h-5 w-5 text-green-500" />
                        Education & Certifications
                      </CardTitle>
                      <CardDescription>
                        Qualifications and certifications to pursue
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dreamJobAnalysis.lackingEducation && dreamJobAnalysis.lackingEducation.length > 0 ? (
                        <div className="space-y-2">
                          {dreamJobAnalysis.lackingEducation.map((education, index) => (
                            <motion.div
                              key={education}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.1 * index }}
                            >
                              <Badge variant="outline" className="w-full justify-start p-3 text-sm">
                                {education}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No education gaps identified
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Lacking Experience */}
                  <Card className="elevation-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Briefcase className="h-5 w-5 text-purple-500" />
                        Experience to Gain
                      </CardTitle>
                      <CardDescription>
                        Professional experience areas to focus on
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dreamJobAnalysis.lackingExperience && dreamJobAnalysis.lackingExperience.length > 0 ? (
                        <div className="space-y-2">
                          {dreamJobAnalysis.lackingExperience.map((experience, index) => (
                            <motion.div
                              key={experience}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.1 * index }}
                            >
                              <Badge variant="outline" className="w-full justify-start p-3 text-sm">
                                {experience}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No experience gaps identified
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Growth Plan - collapsible */}
            {dreamJobAnalysis.growthPlan && dreamJobAnalysis.growthPlan.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button className="w-full group flex items-center justify-between rounded-xl border px-5 py-3 bg-card/70 hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm">
                    <span className="text-2xl font-bold text-foreground flex items-center gap-2">
                      <Zap className="h-6 w-6 text-green-500" />
                      Your Growth Roadmap
                    </span>
                    <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {dreamJobAnalysis.growthPlan.map((milestone, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card className="elevation-2 hover:elevation-3 transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-foreground">
                                  {milestone.milestone}
                                </h3>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {milestone.timeline}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground leading-relaxed">
                                {milestone.details}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* AI Career Roadmap - collapsible */}
            {plan && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button className="w-full group flex items-center justify-between rounded-xl border px-5 py-3 bg-card/70 hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm">
                    <span className="text-2xl font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="h-6 w-6 text-primary" />
                      AI Career Roadmap
                    </span>
                    <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-8">
                    {/* Topics */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold tracking-tight">Core Topics</h3>
                      <div className="flex flex-wrap gap-2.5">
                        {plan.topics.map((t, i) => (
                          <Badge key={i} variant="secondary" className="py-1.5 px-2.5 text-xs md:text-sm rounded-full">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Courses */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold tracking-tight">Curated Courses</h3>
                      <div className="space-y-3 md:space-y-4">
                        {plan.courses.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-6 border rounded-lg p-4 bg-card/60 hover:bg-accent/40 transition-colors"
                          >
                            <div className="space-y-1.5">
                              <div className="font-semibold text-foreground text-sm md:text-base">{c.title}</div>
                              <div className="text-xs text-muted-foreground">{c.provider}</div>
                            </div>
                            <Button asChild size="sm" variant="outline">
                              <a href={c.url} target="_blank" rel="noreferrer">Open</a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Certifications */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-green-500" />
                        Recommended Certifications
                      </h3>
                      <p className="text-sm text-muted-foreground">Optional credentials to signal proficiency</p>
                      <div className="flex flex-wrap gap-2.5">
                        {plan.certifications.map((c, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="py-1.5 px-2.5 text-xs md:text-sm rounded-full inline-flex items-center gap-1.5"
                          >
                            <GraduationCap className="h-3.5 w-3.5" />
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Weekly Action Plan */}
                    <Card className="elevation-2">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <CardTitle className="text-xl font-semibold">Weekly Action Plan</CardTitle>
                            <CardDescription className="text-sm">
                              Check off weeks as you complete them. Progress saves locally — use "Save Progress" to sync.
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={resetProgress}>
                              Reset
                            </Button>
                            <Button size="sm" onClick={handleSaveProgress}>
                              Save Progress
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {plan.timeline.map((w, i) => {
                            const done = completedWeeks.has(w.week);
                            return (
                              <div
                                key={i}
                                className={`rounded-xl border p-5 bg-card/60 relative overflow-hidden ${
                                  done ? "ring-1 ring-green-500/40" : ""
                                }`}
                              >
                                {/* subtle background fill when done */}
                                <div
                                  className={`absolute inset-0 pointer-events-none transition-opacity ${
                                    done ? "opacity-10 bg-green-500" : "opacity-0"
                                  }`}
                                />
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={done}
                                      onCheckedChange={() => toggleWeek(w.week)}
                                      aria-label={`Mark week ${w.week} complete`}
                                    />
                                    <div className="font-semibold text-sm md:text-base">Week {w.week}</div>
                                  </div>
                                  <Badge variant={done ? "secondary" : "outline"} className="text-xs">
                                    {(w.week * (Number(hoursPerWeek) || 0))}h total
                                  </Badge>
                                </div>
                                <div className="h-px bg-border/70 mb-3" />
                                <pre className="whitespace-pre-wrap text-[13px] md:text-sm text-muted-foreground leading-7">
                                  {w.focus}
                                </pre>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Ready to Unlock Your Growth Plan?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Generate personalized insights to understand exactly what skills, education, and experience you need to land your dream job.
            </p>
            <Button
              onClick={handleGenerateInsights}
              disabled={isGeneratingInsights}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isGeneratingInsights ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Your Growth Plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Growth Insights
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Job Description - collapsible */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button className="w-full group flex items-center justify-between rounded-xl border px-5 py-3 hover:bg-accent/50 transition-colors mb-4 mt-8 bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm">
              <span className="text-xl font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Original Job Description
              </span>
              <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="elevation-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Original Job Description
                </CardTitle>
                <CardDescription>
                  The job description for your dream role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                    {dreamJobAnalysis.jobDescription}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </motion.div>
  );
}