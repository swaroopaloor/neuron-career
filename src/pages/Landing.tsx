import { motion, useInView, animate, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/ThemeProvider";
import { Link } from "react-router";
import { 
  FileText, 
  Target, 
  Zap, 
  Shield, 
  Clock,
  Star,
  Users,
  Award,
  Sun,
  Moon,
  Menu,
  Sparkles,
  BarChart3,
  FileCheck,
  Rocket,
  ArrowRight,
  CheckCircle,
  BookOpen,
  Newspaper,
  PenSquare
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Animated numeric counter for stats
function AnimatedCounter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  // Determine if we should animate this value (skip complex formats like "4.9/5" or "< 30s")
  const containsSlash = value.includes("/");
  const startsWithAngle = value.trim().startsWith("<");
  const numericMatch = value.match(/([0-9,.]+)/);
  const end = numericMatch ? parseFloat(numericMatch[1].replace(/,/g, "")) : NaN;
  const suffix = numericMatch ? value.replace(numericMatch[1], "") : "";

  const [display, setDisplay] = useState<number>(0);

  useEffect(() => {
    if (!isInView) return;
    if (!isFinite(end) || containsSlash || startsWithAngle) return;

    const controls = animate(0, end, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [isInView, end, containsSlash, startsWithAngle]);

  if (!isFinite(end) || containsSlash || startsWithAngle) {
    return (
      <span ref={ref} className="tabular-nums">
        {value}
      </span>
    );
  }

  const formatted =
    end >= 1000 ? Math.floor(display).toLocaleString() : Math.round(display).toString();

  return (
    <span ref={ref} className="tabular-nums">
      {formatted}
      {suffix}
    </span>
  );
}

// Subtle particle field background for hero
function ParticleField({
  count = 16,
}: {
  count?: number;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      {Array.from({ length: Math.min(count, 24) }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute block rounded-full bg-primary/15"
          style={{
            width: 6 + (i % 4),
            height: 6 + (i % 4),
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            filter: "blur(0.5px)",
          }}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{
            opacity: [0.25, 0.5, 0.25],
            y: [0, -6 - (i % 5), 0],
            x: [0, (i % 2 === 0 ? 4 : -4), 0],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 7 + (i % 4),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  const { isLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeBlog, setActiveBlog] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Resume Analysis",
      description:
        "ATS-focused scoring, keyword coverage, impact metrics, and prioritized, high‑leverage edits tailored to each job description."
    },
    {
      icon: FileText,
      title: "AI Resume Builder (Live Preview + PDF Export)",
      description:
        "Craft resumes with real-time preview, AI refinement for summary and experience, and one-click high-quality PDF export."
    },
    {
      icon: BarChart3,
      title: "Job Tracker & Applications Analytics",
      description:
        "Centralized tracking for applications with response rates, stages, and trend insights—know what's working and what to improve."
    },
    {
      icon: Target,
      title: "Dream Job Planner & Skill Gap Analysis",
      description:
        "Define your target role, identify gaps, and follow an AI-guided roadmap of skills, projects, and milestones to close the gap."
    },
    {
      icon: Users,
      title: "Interview Coach (Practice & Feedback)",
      description:
        "Role-specific mock interview prep with structured feedback, question banks, and guidance to improve clarity and impact."
    },
    {
      icon: Star,
      title: "Template Library",
      description:
        "Professional, technical, entry-level, and minimal templates—quickly start with best-practice structures and phrasing."
    },
    {
      icon: Shield,
      title: "Profile & Default Resume Storage",
      description:
        "Save your best resume as default for quick access across the app—secure storage with easy updates and versioning."
    },
  ];

  const stats = [
    { icon: Clock, value: "7 sec", label: "Avg recruiter scan time" },
    { icon: Target, value: "2x", label: "Interviews with role-specific keywords" },
    { icon: FileCheck, value: "3x", label: "More callbacks with tailored resumes" },
    { icon: Zap, value: "80%", label: "Companies using ATS filters" }
  ];

  const steps = [
    {
      step: "01",
      title: "Build or Upload Resume",
      description:
        "Start from templates or your existing PDF—use AI to refine summary, experience bullets, and skills. Export high-quality PDFs anytime.",
      icon: FileText
    },
    {
      step: "02",
      title: "Tailor & Prepare",
      description:
        "Paste the job description to get targeted improvements, keyword alignment, and personalized interview prep.",
      icon: Target
    },
    {
      step: "03",
      title: "Analyze, Apply & Track",
      description:
        "Get ATS scores with prioritized fixes, apply with confidence, and track responses and trends in your applications analytics.",
      icon: FileCheck
    }
  ];

  const benefits = [
    "3x more interview callbacks with targeted, ATS‑safe resumes",
    "End‑to‑end workflow: build, analyze, interview, and track",
    "Role‑aware AI refinement for summaries and experience bullets",
    "Analytics to learn what's working and where to iterate"
  ];

  const blogs = [
    {
      icon: BookOpen,
      title: "How to Make Your Resume ATS-Friendly (With Examples)",
      description:
        "A practical guide to formatting, keywords, and structure that gets your resume past automated screening.",
      tag: "Resume Tips",
      content: [
        "Applicant Tracking Systems (ATS) parse your resume to extract structured data—if your formatting is complex, content can be lost. Keep a clean, single-column layout with consistent section headers.",
        "Use standard fonts (Inter, Arial, Times) and avoid text inside images or tables. Bulleted lists are fine. Save as PDF unless the job portal explicitly requests DOCX.",
        "Match keywords from the job description naturally in your summary, skills, and experience bullets. Use exact phrasing where possible (e.g., 'React', not just 'frontend framework').",
        "Quantify achievements: 'Improved API performance by 35%', 'Reduced onboarding time by 2 weeks', 'Shipped 8 features/quarter'.",
        "Sections to include: Summary, Skills, Experience, Education, Projects (optional), Certifications (optional)."
      ],
    },
    {
      icon: Newspaper,
      title: "Cracking Product-Based Companies in India",
      description:
        "From DSA to system design: a structured roadmap for top Indian tech companies and startups.",
      tag: "Career Roadmap",
      content: [
        "Phase 1: Fundamentals — Master data structures (arrays, strings, hashmaps, stacks/queues, trees, graphs) and algorithms (sorting, searching, two pointers, DP).",
        "Phase 2: Projects — Build 2–3 solid, resume-worthy projects: auth, payments, dashboards, file uploads, pagination, caching, and testing.",
        "Phase 3: Interviews — Mix of DSA + low-level design + behavioral. For mid/senior roles: system design (scalability, databases, queues, caching, consistency).",
        "Phase 4: India-specific preparation — Be ready for timed platforms (HackerRank, CodeSignal), and strong fundamentals in SQL and OOP.",
        "Tip: Keep a brag document of achievements and quantify impact for easy recall during interviews."
      ],
    },
    {
      icon: PenSquare,
      title: "Perfecting Your Resume Summary and Experience Bullets",
      description:
        "Impact-focused writing, quantifiable metrics, and role-relevant phrasing that stands out.",
      tag: "Writing",
      content: [
        "Summary: 2–3 lines highlighting role, years of experience, core stack, and 1–2 quantified achievements.",
        "Bullets: Start with action verbs (Built, Optimized, Led, Automated), include the what/why/how, and end with numbers (%, x, time saved, revenue, users).",
        "Example: 'Optimized React rendering pipeline and reduced bundle size by 28%, improving Time-to-Interactive by 1.3s across 200k MAUs.'",
        "Tailor bullets to the job description by aligning keywords and outcomes to the role's priorities.",
      ],
    },
    {
      icon: BookOpen,
      title: "Fresher Resume: Projects, Internships, and Skills That Matter",
      description:
        "A fresher-friendly blueprint with templates for projects, hackathons, and academic work.",
      tag: "Fresher Guide",
      content: [
        "Lead with Education, then Projects, then Internships/Training, then Skills. Use concise summaries for each project.",
        "Pick projects that show real-world workflows: auth, dashboards, APIs, pagination, file storage, caching, and testing.",
        "Add measurable results: users, performance, accuracy, and improvements shipped.",
        "Avoid listing too many skills; keep 8–12 high-confidence skills grouped by category (Languages, Frontend, Backend, Tools).",
      ],
    },
    {
      icon: Newspaper,
      title: "Salary Negotiation in India: Scripts and Market Benchmarks",
      description:
        "City-wise benchmarks, timing the conversation, and culturally aware negotiation scripts.",
      tag: "Negotiation",
      content: [
        "Do market research: check levels.fyi, AmbitionBox, and peers in your city/level. Factor in benefits (ESOPs, WFH, allowances).",
        "Script: 'Based on market benchmarks and my experience leading X projects with Y impact, I'm targeting a total compensation of ₹[X]. Is there room in the budget to meet that?'",
        "Never volunteer your current CTC first. Anchor with total compensation and keep trade-offs ready (joining bonus, variable pay, ESOPs).",
        "Time it right: after the final round and a strong signal, but before accepting the offer.",
      ],
    },
    {
      icon: PenSquare,
      title: "LinkedIn Optimization for the Indian Job Market",
      description:
        "Headline, About, keywords, and networking tactics to increase recruiter responses.",
      tag: "LinkedIn",
      content: [
        "Headline: Role + Stack + Impact metric (e.g., 'Frontend Engineer | React/Next.js | Performance +28%').",
        "About: 3–4 short paragraphs—summary, core skills, achievements with numbers, and what you're looking for.",
        "Add featured: resume PDF, projects, demos, or blog posts. Keep your profile image professional and background relevant.",
        "Daily habit: 10–15 mins—comment thoughtfully on posts, connect with recruiters/hiring managers with a short, respectful note.",
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-background"
    >
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16 md:h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">Resume Analyzer</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium no-underline"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium no-underline"
              >
                How it Works
              </a>
              <a
                href="#blogs"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium no-underline"
              >
                Blogs
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col space-y-8 pt-12">
                    <SheetClose asChild>
                      <a href="#features" className="text-xl font-medium hover:text-primary transition-colors">
                        Features
                      </a>
                    </SheetClose>
                    <SheetClose asChild>
                      <a href="#how-it-works" className="text-xl font-medium hover:text-primary transition-colors">
                        How it Works
                      </a>
                    </SheetClose>
                    <SheetClose asChild>
                      <a href="#blogs" className="text-xl font-medium hover:text-primary transition-colors">
                        Blogs
                      </a>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-12 sm:pt-24 sm:pb-14 md:pt-28 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-20 gradient-bg-subtle"></div>
        
        {/* Readability overlay to ensure professional contrast over WebGL */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-background/25 via-background/10 to-transparent backdrop-blur-[1px]" />

        <div className="container-responsive relative px-6 z-10">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Badge className="mb-8 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 text-base px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Resume Analysis
              </Badge>
            </motion.div>
            
            <motion.h1
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-8 tracking-tight leading-[1.15] text-balance"
            >
              Land Your Dream Job with{" "}
              <span className="text-gradient block mt-4">
                AI-Powered Insights
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-sm sm:text-base text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Upload your resume or build one from scratch, tailor it to any job with AI, get ATS-ready analysis, practice interviews, and track every application—all in one place. 
              Now with a live resume builder, PDF export, templates library, analytics dashboard, and a guided dream‑job roadmap.
            </motion.p>
            
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-16"
            >
              <div>
                <Button size="lg" asChild className="shadow-xl hover:shadow-2xl h-12 px-6 text-base sm:h-14 sm:px-8 sm:text-lg">
                  <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                    <Rocket className="mr-3 h-6 w-6" />
                    {isAuthenticated ? "Go to Dashboard" : "Start Free Analysis"}
                  </Link>
                </Button>
              </div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 text-base sm:h-14 sm:px-8 sm:text-lg"
                  onClick={() => {
                    const el = document.getElementById("how-it-works");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  See How It Works
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Benefits List */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mb-10 sm:mb-12"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 220, damping: 16 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border"
                >
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-secondary/30 py-12 sm:py-14">
        <div className="container-responsive">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-12"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                whileHover={{ y: -6, scale: 1.03 }}
                className="text-center group"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-105 transition-transform border border-primary/20">
                  <stat.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1 sm:mb-2">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-muted-foreground text-sm sm:text-base font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-20">
        <div className="container-responsive">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-balance">
              Powerful Features for Modern Job Seekers
            </h2>
            <p className="text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Everything you need to optimize your resume and land more interviews with cutting-edge AI technology
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <Card className="h-full border shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-105 transition-transform border border-primary/20">
                      <feature.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl mb-2 sm:mb-3">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-20 bg-secondary/30">
        <div className="container-responsive">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-balance">
              How It Works
            </h2>
            <p className="text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Get professional resume analysis in three simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="text-center group"
              >
                <div className="relative mb-6 sm:mb-8">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-105 transition-transform">
                    <step.icon className="h-10 w-10 sm:h-12 sm:w-12 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-9 h-9 sm:w-10 sm:h-10 bg-secondary rounded-full flex items-center justify-center text-base sm:text-lg font-bold text-secondary-foreground shadow-lg">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blogs Section */}
      <section id="blogs" className="py-16 md:py-20">
        <div className="container-responsive">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-balance">
              Blogs & Guides
            </h2>
            <p className="text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Deep dives on resumes, interviews, negotiation, and job search strategies for India's job market
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {blogs.map((post, idx) => (
              <motion.div
                key={post.title}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.6 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <Card 
                  className="h-full border shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  onClick={() => setActiveBlog(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveBlog(idx);
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                        <post.icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {post.tag}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {post.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20">
        <div className="container-responsive">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="p-8 sm:p-12 md:p-16">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-balance">
                  Ready to Transform Your Career?
                </h2>
                <p className="text-base text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of professionals who have optimized their resumes and landed their dream jobs with our AI-powered platform.
                </p>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" asChild className="shadow-xl hover:shadow-2xl h-12 px-8 text-base sm:h-16 sm:px-12 sm:text-xl">
                    <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                      <Rocket className="mr-3 h-6 w-6" />
                      {isAuthenticated ? "Go to Dashboard" : "Start Your Free Analysis"}
                    </Link>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container-responsive">
          <div className="flex flex-col md:flex-row justify-between items-center py-10 md:py-16 px-6">
            <Link to="/" className="flex items-center gap-3 mb-6 md:mb-0 group">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Resume Analyzer</span>
            </Link>
            <div className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} Copyrights belong to ALOOR SAI SWAROOP
            </div>

          </div>
        </div>
      </footer>

      <Dialog open={activeBlog !== null} onOpenChange={(open) => !open && setActiveBlog(null)}>
        <DialogContent className="max-w-2xl">
          {activeBlog !== null && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                    {(() => {
                      const Icon = blogs[activeBlog].icon;
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{blogs[activeBlog].title}</DialogTitle>
                    <DialogDescription className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">
                        {blogs[activeBlog].tag}
                      </span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                {blogs[activeBlog].content.map((para: string, i: number) => (
                  <p key={i} className="text-sm">{para}</p>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}