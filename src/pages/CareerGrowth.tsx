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
import { Sparkles, GraduationCap, Target, Clock, Link as LinkIcon, ListChecks } from "lucide-react";

type Plan = {
  topics: string[];
  courses: Array<{ title: string; provider: string; url: string }>;
  certifications: string[];
  timeline: Array<{ week: number; focus: string }>;
  summary: string;
};

function rolePreset(role: string) {
  const r = role.toLowerCase();
  if (r.includes("data")) {
    return {
      topics: ["Python", "SQL", "Statistics", "Pandas/Numpy", "Data Viz (Tableau/Power BI)", "ML Basics"],
      courses: [
        { title: "Google Data Analytics", provider: "Coursera", url: "https://www.coursera.org/professional-certificates/google-data-analytics" },
        { title: "Introduction to Machine Learning", provider: "Kaggle Learn", url: "https://www.kaggle.com/learn/intro-to-machine-learning" },
        { title: "SQL for Data Analysis", provider: "Mode", url: "https://mode.com/sql-tutorial/" },
      ],
      certs: ["Google Data Analytics Professional Certificate", "Databricks Lakehouse Fundamentals"],
    };
  }
  if (r.includes("frontend")) {
    return {
      topics: ["HTML/CSS", "JavaScript/TypeScript", "React + Router", "State Mgmt", "Testing (Vitest/Jest)", "Performance & Accessibility"],
      courses: [
        { title: "Epic React", provider: "Kent C. Dodds", url: "https://epicreact.dev/" },
        { title: "TypeScript for JS Devs", provider: "Frontend Masters", url: "https://frontendmasters.com/learn/typescript/" },
        { title: "Web Accessibility", provider: "Google", url: "https://web.dev/learn/accessibility/" },
      ],
      certs: ["Meta Front-End Developer", "Google Mobile Web Specialist"],
    };
  }
  if (r.includes("backend")) {
    return {
      topics: ["Node.js", "APIs (REST/GraphQL)", "Databases (SQL/NoSQL)", "Auth & Security", "Cloud (AWS/GCP)", "Observability"],
      courses: [
        { title: "Node.js, Express, MongoDB", provider: "Udemy", url: "https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/" },
        { title: "Designing RESTful APIs", provider: "Udacity", url: "https://www.udacity.com/course/designing-restful-apis--ud388" },
        { title: "AWS Cloud Practitioner", provider: "AWS", url: "https://www.aws.training/Details/Curriculum?id=20685" },
      ],
      certs: ["AWS Cloud Practitioner", "Google Associate Cloud Engineer"],
    };
  }
  if (r.includes("product")) {
    return {
      topics: ["Product Strategy", "User Research", "Roadmapping", "Metrics/Analytics", "Design Basics", "Stakeholder Management"],
      courses: [
        { title: "Become a Product Manager", provider: "Udemy", url: "https://www.udemy.com/course/become-a-product-manager-learn-the-skills-get-a-job/" },
        { title: "Measuring Product Success", provider: "Coursera", url: "https://www.coursera.org/specializations/uva-darden-digital-product-management" },
        { title: "UX Research", provider: "NN/g", url: "https://www.nngroup.com/courses/ux-research/" },
      ],
      certs: ["Product Manager Certification (PMI-ACP)", "Product Analytics Micro-Cert"],
    };
  }
  if (r.includes("cloud") || r.includes("devops")) {
    return {
      topics: ["Linux & Networking", "CI/CD", "Containers (Docker)", "Kubernetes", "IaC (Terraform)", "Monitoring"],
      courses: [
        { title: "Docker & Kubernetes", provider: "Udemy", url: "https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/" },
        { title: "Introduction to DevOps", provider: "IBM", url: "https://www.coursera.org/professional-certificates/devops-and-software-engineering" },
        { title: "HashiCorp Terraform", provider: "HashiCorp", url: "https://learn.hashicorp.com/terraform" },
      ],
      certs: ["CKA - Certified Kubernetes Administrator", "AWS SysOps Administrator"],
    };
  }
  // default
  return {
    topics: ["Fundamentals", "Projects/Portfolio", "Interview Prep", "Networking", "Mentorship", "Consistent Practice"],
    courses: [
      { title: "Career Development Specialization", provider: "Coursera", url: "https://www.coursera.org/specializations/career-success" },
      { title: "Effective Networking", provider: "LinkedIn Learning", url: "https://www.linkedin.com/learning/topics/networking" },
      { title: "Projects that get you hired", provider: "Scrimba", url: "https://scrimba.com/" },
    ],
    certs: ["Role-specific certificate of choice", "Foundational professional badge"],
  };
}

function buildTimeline(topics: string[], weeks: number) {
  const items: Array<{ week: number; focus: string }> = [];
  const per = Math.max(1, Math.floor(weeks / Math.max(1, topics.length)));
  let week = 1;
  for (const t of topics) {
    const span = Math.min(per, Math.max(1, weeks - week + 1));
    for (let i = 0; i < span && week <= weeks; i++) {
      items.push({ week, focus: `${t}${i === 0 ? " - Foundations" : i === 1 ? " - Applied" : " - Practice"}` });
      week++;
    }
  }
  // Fill remaining weeks with revision/interview prep
  while (week <= weeks) {
    items.push({ week, focus: "Interview Prep & Portfolio Polish" });
    week++;
  }
  return items;
}

export default function CareerGrowth() {
  const [about, setAbout] = useState("");
  const [dreamRole, setDreamRole] = useState("");
  const [weeks, setWeeks] = useState<number>(12);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);

  const disabled = useMemo(() => !dreamRole.trim() && !about.trim(), [about, dreamRole]);

  function generatePlan() {
    setLoading(true);
    const preset = rolePreset(dreamRole || about);
    const topics = preset.topics;
    const timeline = buildTimeline(topics, weeks);
    const summary = `Personalized roadmap for "${dreamRole || "your target role"}" over ${weeks} weeks. Focus on fundamentals first, then build real projects and demonstrate outcomes.`;
    const p: Plan = {
      topics,
      courses: preset.courses,
      certifications: preset.certs,
      timeline,
      summary,
    };
    setTimeout(() => {
      setPlan(p);
      setLoading(false);
      toast.success("Career Growth plan generated");
    }, 350);
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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Career Growth Planner</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Describe yourself and your dream role. Get a clear path with topics, courses, certifications, and a weekly timeline.
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
                  {loading ? "Generating..." : "Generate Growth Plan"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Recommended Courses & Certifications
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
                  Generate a plan to see handpicked courses and certifications tailored to your goals.
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
                Learning Topics
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
                  Your personalized topics will appear here after generating the plan.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                {plan ? `Weekly Timeline (${weeks} weeks)` : "Weekly Timeline"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan ? (
                <>
                  <p className="text-sm text-muted-foreground">{plan.summary}</p>
                  <div className="space-y-2">
                    {plan.timeline.map((t) => (
                      <div key={t.week} className="flex items-start gap-3">
                        <div className="mt-1 w-2 h-2 rounded-full bg-primary" />
                        <div>
                          <p className="text-sm font-medium">Week {t.week}</p>
                          <p className="text-sm text-muted-foreground">{t.focus}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Generate a plan to see your week-by-week roadmap with clear milestones.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
