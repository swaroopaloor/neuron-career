import { motion } from "framer-motion";
import { useQuery, useAction } from "convex/react";
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
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "react-router-dom";

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
  AlertCircle
} from "lucide-react";

export default function DreamJob() {
  const dreamJobAnalysis = useQuery(api.analyses.getDreamJobAnalysis);
  const generateInsights = useAction(api.aiCareerGrowth.generateGrowthInsights);
  const generateCareerPlan = useAction(api.aiCareerGrowth.generateCareerPlan);

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

  // Chart data based on timeline length and hours/week
  const computedWeeks = plan?.timeline?.length || weeks;
  const chartData =
    Array.from({ length: computedWeeks }, (_, i) => {
      const w = i + 1;
      return {
        week: `W${w}`,
        cumulativeHours: w * (Number(hoursPerWeek) || 0),
      };
    });

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
          <div className="flex items-center h-16 gap-4">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dream Job Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <Card className="elevation-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                {/* Progress chart */}
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Estimated weekly investment and cumulative progress
                  </div>
                  <ChartContainer
                    className="rounded-lg border bg-card p-2"
                    config={{
                      progress: { label: "Cumulative Hours", color: "hsl(var(--primary))" },
                    }}
                  >
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line
                        type="monotone"
                        dataKey="cumulativeHours"
                        name="Cumulative Hours"
                        stroke="var(--color-progress)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                  <div className="text-xs text-muted-foreground">
                    Target: {computedWeeks} weeks • {hoursPerWeek} hrs/week • Total ~{" "}
                    {computedWeeks * (Number(hoursPerWeek) || 0)} hrs
                  </div>
                </div>
              </div>

              {plan?.summary && (
                <div className="mt-6 p-4 rounded-md bg-muted/40 text-sm leading-relaxed">
                  {plan.summary}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {hasInsights ? (
          <div className="space-y-8">
            {/* Gap Analysis */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-orange-500" />
                Gap Analysis
              </h2>
              
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
            </motion.div>

            {/* Growth Plan */}
            {dreamJobAnalysis.growthPlan && dreamJobAnalysis.growthPlan.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-green-500" />
                  Your Growth Roadmap
                </h2>
                
                <div className="space-y-6">
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
                </div>
              </motion.div>
            )}

            {plan && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="space-y-8"
              >
                {/* Topics to focus */}
                {plan.topics.length > 0 && (
                  <Card className="elevation-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-primary" />
                        Key Topics to Master
                      </CardTitle>
                      <CardDescription>High-impact topics aligned to your goal</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {plan.topics.map((t, i) => (
                          <Badge key={i} variant="secondary" className="py-1 px-2">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Curated courses */}
                {plan.courses.length > 0 && (
                  <Card className="elevation-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <GraduationCap className="h-5 w-5 text-green-500" />
                        Curated Courses
                      </CardTitle>
                      <CardDescription>Top learning resources with direct links</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {plan.courses.map((c, i) => (
                          <div key={i} className="flex items-center justify-between gap-4 border rounded-md p-3">
                            <div className="space-y-1">
                              <div className="font-medium">{c.title}</div>
                              <div className="text-xs text-muted-foreground">{c.provider}</div>
                            </div>
                            <Button asChild size="sm" variant="outline">
                              <a href={c.url} target="_blank" rel="noreferrer">Open</a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Certifications */}
                {plan.certifications.length > 0 && (
                  <Card className="elevation-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Badge className="bg-primary text-primary-foreground">Certs</Badge>
                        Recommended Certifications
                      </CardTitle>
                      <CardDescription>Credentials that add credibility</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {plan.certifications.map((c, i) => (
                          <Badge key={i} variant="outline" className="py-1 px-2">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Weekly Timeline as rich cards */}
                {plan.timeline.length > 0 && (
                  <Card className="elevation-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Weekly Action Plan</CardTitle>
                      <CardDescription>Exactly what to focus on each week</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plan.timeline.map((w, i) => (
                          <div key={i} className="rounded-lg border p-4 bg-card/60">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold">Week {w.week}</div>
                              <Badge variant="secondary">{(w.week * (Number(hoursPerWeek) || 0))}h total</Badge>
                            </div>
                            <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{w.focus}</pre>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
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

        {/* Job Description */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
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
        </motion.div>
      </div>
    </motion.div>
  );
}