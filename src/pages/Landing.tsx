import { motion, useInView, animate, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/ThemeProvider";
import { Link } from "react-router-dom";
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
  CheckCircle
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import AbstractThreeDVisual from "@/components/AbstractThreeDVisual";

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
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze your resume against job requirements with 95% accuracy and detailed insights."
    },
    {
      icon: BarChart3,
      title: "ATS Optimization", 
      description: "Get detailed ATS compatibility scores and specific recommendations to pass applicant tracking systems effortlessly."
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Receive comprehensive analysis reports in under 30 seconds with actionable insights and improvement suggestions."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption ensures your documents are processed securely and never permanently stored on our servers."
    }
  ];

  const stats = [
    { icon: Users, value: "50,000+", label: "Resumes Analyzed" },
    { icon: Award, value: "98%", label: "Success Rate" },
    { icon: Star, value: "4.9/5", label: "User Rating" },
    { icon: Clock, value: "< 30s", label: "Analysis Time" }
  ];

  const steps = [
    {
      step: "01",
      title: "Upload Resume",
      description: "Drag and drop your PDF resume or browse from your device. We support all standard formats including PDF, DOC, and DOCX.",
      icon: FileText
    },
    {
      step: "02", 
      title: "Add Job Description",
      description: "Paste the target job description. Our AI will identify key requirements, skills, and qualifications automatically.",
      icon: Target
    },
    {
      step: "03",
      title: "Get Analysis",
      description: "Receive detailed match scores, ATS ratings, and personalized improvement recommendations to boost your chances.",
      icon: FileCheck
    }
  ];

  const benefits = [
    "Increase interview callbacks by 3x",
    "Pass ATS systems with confidence", 
    "Get personalized improvement tips",
    "Save hours of manual optimization"
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
        
        {/* 3D WebGL Visual */}
        <AbstractThreeDVisual />
        
        {!reduceMotion && <ParticleField count={16} />}
        {!reduceMotion && (
          <div className="pointer-events-none absolute inset-0 -z-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full blur-3xl opacity-30"
                style={{
                  width: `${120 + (i % 3) * 40}px`,
                  height: `${120 + (i % 3) * 40}px`,
                  left: `${(i * 12) % 100}%`,
                  top: `${(i * 9 + 10) % 90}%`,
                  background:
                    i % 2 === 0
                      ? "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.6), transparent 60%)"
                      : "radial-gradient(circle at 70% 70%, rgba(236,72,153,0.6), transparent 60%)",
                }}
                initial={{ y: 0, scale: 0.98 }}
                animate={{ y: [0, -12, 0], scale: [0.98, 1.02, 0.98] }}
                transition={{ duration: 7 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
              />
            ))}
          </div>
        )}

        <div className="container-responsive relative px-6">
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
              Upload your resume and job description to get instant AI analysis, 
              ATS optimization scores, and personalized recommendations that boost your hiring chances by 3x.
            </motion.p>
            
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-16"
            >
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Button size="lg" asChild className="shadow-xl hover:shadow-2xl h-12 px-6 text-base sm:h-14 sm:px-8 sm:text-lg">
                  <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                    <Rocket className="mr-3 h-6 w-6" />
                    {isAuthenticated ? "Go to Dashboard" : "Start Free Analysis"}
                  </Link>
                </Button>
              </motion.div>
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
    </motion.div>
  );
}