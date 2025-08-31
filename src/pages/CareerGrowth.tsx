import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GraduationCap, Target, Clock, Link as LinkIcon, ListChecks, Sparkles } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

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
      });
      
      setPlan(result);
      toast.success("AI-powered career growth plan generated!");
    } catch (error) {
      console.error("Error generating career plan:", error);
      toast.error("Failed to generate career plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Career Growth Planner</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Describe yourself and your dream role. Get an AI-powered personalized path with topics, courses, certifications, and a weekly timeline.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Dream Role</label>
                <Input
                  placeholder="e.g., Senior Data Analyst, Frontend Engineer, Product Manager"
                  value={dreamRole}
                  onChange={(e) => setDreamRole(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">About You</label>
                <Textarea
                  placeholder="Briefly describe your background, current skills, and interests..."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Target Timeline
                  </label>
                  <Select value={String(weeks)} onValueChange={(v) => setWeeks(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 weeks (Fast-Track)</SelectItem>
                      <SelectItem value="8">8 weeks</SelectItem>
                      <SelectItem value="12">12 weeks</SelectItem>
                      <SelectItem value="24">24 weeks (Deep-Dive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-2">
                <Button disabled={disabled || loading} onClick={generatePlan} className="w-full h-11">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Generating AI Plan...
                    </div>
                  ) : (
                    "Generate AI Career Plan"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                AI-Recommended Courses & Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan ? (
                <>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Courses</h3>
                    <ul className="space-y-2">
                      {plan.courses.map((c, i) => (
                        <li key={i} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">{c.title}</p>
                            <p className="text-xs text-muted-foreground">{c.provider}</p>
                          </div>
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
                          >
                            <LinkIcon className="w-4 h-4" /> View
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Certifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {plan.certifications.map((cert, i) => (
                        <span key={i} className="px-3 py-1 rounded-full border text-sm">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Generate an AI plan to see personalized courses and certifications tailored to your specific goals and background.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary" />
                AI-Curated Learning Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plan ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.topics.map((t, i) => (
                    <li key={i} className="rounded-lg border p-3 text-sm">{t}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Your AI-personalized learning topics will appear here after generating the plan.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                {plan ? `AI Weekly Timeline (${weeks} weeks)` : "AI Weekly Timeline"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan ? (
                <>
                  <p className="text-sm text-muted-foreground">{plan.summary}</p>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {plan.timeline.map((t) => {
                      const lines = (t.focus || "").split(/\r?\n/).filter(Boolean);
                      return (
                        <div key={t.week} className="rounded-lg border p-3 bg-card">
                          <p className="text-sm font-semibold mb-1">Week {t.week}</p>
                          {lines.length > 1 ? (
                            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                              {lines.map((line, i) => (
                                <li key={i}>{line.replace(/^[-•]\s*/, "")}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">{t.focus}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Generate an AI plan to see your personalized week-by-week roadmap with clear, actionable milestones.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}