import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { 
  Sparkles, 
  Target, 
  Clock, 
  User, 
  BookOpen, 
  Award, 
  Calendar,
  ExternalLink,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import AnalysisLoading from "@/components/AnalysisLoading";

type Plan = {
  topics: string[];
  courses: Array<{ title: string; provider: string; url: string }>;
  certifications: string[];
  timeline: Array<{ week: number; focus: string }>;
  summary: string;
};

export default function CareerGrowth() {
  const [about, setAbout] = useState("");
  const [dreamRole, setDreamRole] = useState("");
  const [weeks, setWeeks] = useState<number>(12);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [currentLevel, setCurrentLevel] = useState<string>("mid");
  const [yearsExperience, setYearsExperience] = useState<number>(2);
  const [hoursPerWeek, setHoursPerWeek] = useState<number[]>([8]);

  const generateCareerPlan = useAction(api.aiCareerGrowth.generateCareerPlan);

  const disabled = useMemo(() => !dreamRole.trim() && !about.trim(), [about, dreamRole]);

  async function generatePlan() {
    if (!dreamRole.trim() && !about.trim()) {
      toast.error("Please provide either your dream role or background information");
      return;
    }

    setLoading(true);
    try {
      const result = await generateCareerPlan({
        about: about.trim(),
        dreamRole: dreamRole.trim(),
        weeks,
        currentLevel,
        yearsExperience,
        hoursPerWeek: hoursPerWeek[0],
      });
      
      setPlan(result);
      toast.success("Your personalized career roadmap is ready!");
    } catch (error) {
      console.error("Error generating career plan:", error);
      toast.error("Failed to generate career plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <AnalysisLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Craft Your Career Roadmap
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get an AI-powered, personalized learning path tailored to your dream role, 
            complete with courses, certifications, and a week-by-week timeline.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!plan ? (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl">Tell Us About Your Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Dream Role & Background */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Target className="w-4 h-4" />
                      Your Aspirations
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dream-role">Dream Role</Label>
                        <Input
                          id="dream-role"
                          placeholder="e.g., Senior Data Scientist at Google, Head Chef, UX Designer"
                          value={dreamRole}
                          onChange={(e) => setDreamRole(e.target.value)}
                          className="h-12"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="about">Your Background</Label>
                        <Textarea
                          id="about"
                          placeholder="Tell us about your current skills, experience, and what excites you about this career path..."
                          value={about}
                          onChange={(e) => setAbout(e.target.value)}
                          className="min-h-[120px] resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Experience & Commitment */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="w-4 h-4" />
                      Your Current Level
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Experience Level</Label>
                        <Select value={currentLevel} onValueChange={setCurrentLevel}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student / Bootcamp</SelectItem>
                            <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                            <SelectItem value="mid">Mid-level (2-5 years)</SelectItem>
                            <SelectItem value="senior">Senior (5+ years)</SelectItem>
                            <SelectItem value="lead">Lead / Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Years of Experience</Label>
                        <Input
                          type="number"
                          min={0}
                          max={50}
                          value={yearsExperience}
                          onChange={(e) => setYearsExperience(Math.max(0, parseInt(e.target.value) || 0))}
                          className="h-12"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Timeline & Commitment */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Time Commitment
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label>Learning Timeline</Label>
                        <Select value={String(weeks)} onValueChange={(v) => setWeeks(Number(v))}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">4 weeks (Intensive)</SelectItem>
                            <SelectItem value="8">8 weeks (Focused)</SelectItem>
                            <SelectItem value="12">12 weeks (Balanced)</SelectItem>
                            <SelectItem value="16">16 weeks (Comprehensive)</SelectItem>
                            <SelectItem value="24">24 weeks (Deep Dive)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Hours per week: {hoursPerWeek[0]}h</Label>
                        <div className="px-3">
                          <Slider
                            value={hoursPerWeek}
                            onValueChange={setHoursPerWeek}
                            max={40}
                            min={2}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>2h</span>
                            <span>40h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={generatePlan} 
                    disabled={disabled || loading}
                    className="w-full h-14 text-lg font-semibold"
                    size="lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate My Career Roadmap
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="career-plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Plan Header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Your Personalized Career Roadmap</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">{plan.summary}</p>
                <Button 
                  variant="outline" 
                  onClick={() => setPlan(null)}
                  className="mt-4"
                >
                  Create New Plan
                </Button>
              </div>

              {/* Plan Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Topics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Key Learning Topics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {plan.topics.map((topic, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-medium text-primary">{i + 1}</span>
                            </div>
                            <p className="text-sm leading-relaxed">{topic}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Courses */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Recommended Courses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {plan.courses.map((course, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-4 rounded-lg border hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-medium group-hover:text-primary transition-colors">
                                  {course.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">{course.provider}</p>
                              </div>
                              <a
                                href={course.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium"
                              >
                                View Course
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Certifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        Target Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {plan.certifications.map((cert, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="px-3 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                          >
                            {cert}
                          </motion.span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Weekly Timeline ({weeks} weeks)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {plan.timeline.map((week, i) => {
                          const lines = week.focus.split('\n').filter(Boolean);
                          return (
                            <AccordionItem key={week.week} value={`week-${week.week}`}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary">{week.week}</span>
                                  </div>
                                  <span>Week {week.week}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="pl-11 space-y-2">
                                  {lines.map((line, lineIndex) => (
                                    <div key={lineIndex} className="flex items-start gap-2 text-sm">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                                      <span className="leading-relaxed">{line.replace(/^[-•]\s*/, '')}</span>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}