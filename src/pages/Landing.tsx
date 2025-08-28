import { motion } from "framer-motion";
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
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

export default function Landing() {
  const { isLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      <section className="relative pt-24 pb-16 sm:pt-28 sm:pb-20 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 gradient-bg-subtle"></div>
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
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 tracking-tight leading-[1.1] text-balance"
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
              className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed"
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
              <Button size="lg" asChild className="shadow-xl hover:shadow-2xl h-12 px-6 text-base sm:h-14 sm:px-8 sm:text-lg">
                <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                  <Rocket className="mr-3 h-6 w-6" />
                  {isAuthenticated ? "Go to Dashboard" : "Start Free Analysis"}
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-12 px-6 text-base sm:h-14 sm:px-8 sm:text-lg">
                <Link to="/#how-it-works">
                  See How It Works
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            {/* Benefits List */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mb-16 sm:mb-20"
            >
              {benefits.map((benefit, index) => (
                <div key={benefit} className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{benefit}</span>
                </div>
              ))}
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 1 }}
              className="relative max-w-6xl mx-auto"
            >
              <Card className="overflow-hidden shadow-2xl border bg-gradient-to-br from-card to-muted/20">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-6 sm:p-12 md:p-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                      {steps.map((step, index) => (
                        <motion.div
                          key={step.step}
                          initial={{ y: 30, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8 + index * 0.1, duration: 0.8 }}
                          className="text-center"
                        >
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-6 relative border border-primary/20">
                            <step.icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground shadow-lg">
                              {index + 1}
                            </div>
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3">{step.title}</h3>
                          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{step.description.split('.')[0]}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-secondary/30">
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
                className="text-center group"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-105 transition-transform border border-primary/20">
                  <stat.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1 sm:mb-2">{stat.value}</div>
                <div className="text-muted-foreground text-sm sm:text-base font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-padding">
        <div className="container-responsive">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
              Powerful Features for Modern Job Seekers
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
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
              >
                <Card className="h-full border shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-105 transition-transform border border-primary/20">
                      <feature.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl mb-2 sm:mb-3">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base sm:text-lg leading-relaxed text-muted-foreground">
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
      <section id="how-it-works" className="section-padding bg-secondary/30">
        <div className="container-responsive">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
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
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">
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
      <section className="section-padding">
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
                <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-8 text-balance">
                  Ready to Transform Your Career?
                </h2>
                <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of professionals who have optimized their resumes and landed their dream jobs with our AI-powered platform.
                </p>
                <Button size="lg" asChild className="shadow-xl hover:shadow-2xl h-12 px-8 text-base sm:h-16 sm:px-12 sm:text-xl">
                  <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                    <Rocket className="mr-3 h-6 w-6" />
                    {isAuthenticated ? "Go to Dashboard" : "Start Your Free Analysis"}
                  </Link>
                </Button>
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