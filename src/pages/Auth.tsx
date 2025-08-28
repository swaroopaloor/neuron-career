import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Mail, 
  UserX,
  Sparkles,
  Briefcase,
  FileText,
  Shield,
  Zap,
  Target
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface AuthProps {
  redirectAfterAuth?: string;
}

const features = [
  {
    icon: <Sparkles className="h-12 w-12 text-primary" />,
    title: "AI-Powered Analysis",
    description: "Get instant feedback on your resume against any job description with advanced AI algorithms.",
    color: "from-blue-500/20 to-purple-500/20"
  },
  {
    icon: <Briefcase className="h-12 w-12 text-primary" />,
    title: "Job Application Tracker",
    description: "Manage all your job applications in one place with our intuitive Kanban board system.",
    color: "from-green-500/20 to-blue-500/20"
  },
  {
    icon: <FileText className="h-12 w-12 text-primary" />,
    title: "Personalized Cover Letters",
    description: "Generate tailored cover letters and interview prep kits in seconds using AI.",
    color: "from-purple-500/20 to-pink-500/20"
  },
  {
    icon: <Shield className="h-12 w-12 text-primary" />,
    title: "Secure & Private",
    description: "Your data is encrypted and secure. We never share your personal information.",
    color: "from-red-500/20 to-orange-500/20"
  },
  {
    icon: <Zap className="h-12 w-12 text-primary" />,
    title: "Lightning Fast",
    description: "Get results in seconds, not hours. Our optimized platform delivers instant insights.",
    color: "from-yellow-500/20 to-red-500/20"
  },
  {
    icon: <Target className="h-12 w-12 text-primary" />,
    title: "Goal Tracking",
    description: "Set and track your career goals with our comprehensive analytics dashboard.",
    color: "from-indigo-500/20 to-blue-500/20"
  },
];

const testimonials = [
  {
    text: "This platform helped me land my dream job in just 2 weeks!",
    author: "Sarah Chen",
    role: "Software Engineer at Google"
  },
  {
    text: "The AI feedback on my resume was incredibly detailed and helpful.",
    author: "Michael Rodriguez",
    role: "Product Manager at Microsoft"
  },
  {
    text: "Finally, a job tracker that actually makes sense and is easy to use.",
    author: "Emily Johnson",
    role: "UX Designer at Apple"
  }
];

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = redirectAfterAuth || "/";
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirectAfterAuth]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      const redirect = redirectAfterAuth || "/";
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      const redirect = redirectAfterAuth || "/";
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(`Failed to sign in as guest: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-bg-subtle">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid-16" />
        {/* Floating Elements */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
            }}
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left side - Enhanced Feature showcase */}
        <div className="flex flex-col items-center justify-center p-8 lg:p-12 text-center relative order-last lg:order-first">
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-12"
          >
            <img
              src="/logo_bg.svg"
              alt="Logo"
              width={100}
              height={100}
              className="mx-auto mb-6"
            />
            <h1 className="text-4xl lg:text-5xl font-bold text-gradient mb-4">
              Welcome Back
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Join thousands of professionals who've accelerated their careers with our AI-powered platform
            </p>
          </motion.div>

          {/* Feature Carousel */}
          <div className="relative h-80 w-full max-w-lg mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={featureIndex}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.9 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Card className={`h-full glass-card border-primary/20 bg-gradient-to-br ${features[featureIndex].color}`}>
                  <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="mb-6 p-4 bg-background/50 rounded-2xl shadow-lg">
                      {features[featureIndex].icon}
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      {features[featureIndex].title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {features[featureIndex].description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Feature Indicators */}
          <div className="flex gap-2 mb-8">
            {features.map((_, index) => (
              <motion.div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === featureIndex ? 'bg-primary w-8' : 'bg-primary/30'
                }`}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>

          {/* Testimonial */}
          <div className="relative h-24 w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 text-center"
              >
                <blockquote className="text-sm text-muted-foreground italic mb-2">
                  "{testimonials[testimonialIndex].text}"
                </blockquote>
                <cite className="text-xs font-medium text-foreground">
                  {testimonials[testimonialIndex].author}
                  <span className="text-muted-foreground block">
                    {testimonials[testimonialIndex].role}
                  </span>
                </cite>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right side - Enhanced Auth form */}
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
          {/* Back Button */}
          <header className="absolute top-6 left-6 z-20">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground glass-card"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </header>

          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {step === "signIn" ? (
                <motion.div
                  key="signIn"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Card className="glass-card border-primary/20 shadow-2xl">
                    <CardHeader className="text-center pb-8">
                      <CardTitle className="text-3xl font-bold text-gradient">Get Started</CardTitle>
                      <CardDescription className="text-base">
                        Enter your email to log in or create an account
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleEmailSubmit}>
                      <CardContent className="space-y-6">
                        <div className="relative flex items-center gap-3">
                          <div className="relative flex-1">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              name="email"
                              placeholder="name@example.com"
                              type="email"
                              className="pl-12 h-12 text-base border-primary/20 focus:border-primary"
                              disabled={isLoading}
                              required
                            />
                          </div>
                          <Button
                            type="submit"
                            size="lg"
                            className="h-12 px-6"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <ArrowRight className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                          >
                            {error}
                          </motion.p>
                        )}
                        
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-primary/20" />
                          </div>
                          <div className="relative flex justify-center text-sm uppercase">
                            <span className="bg-card px-4 text-muted-foreground font-medium">
                              Or continue with
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="w-full h-12 border-primary/20 hover:border-primary"
                          onClick={handleGuestLogin}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          ) : (
                            <UserX className="mr-3 h-5 w-5" />
                          )}
                          Continue as Guest
                        </Button>
                      </CardContent>
                    </form>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Card className="glass-card border-primary/20 shadow-2xl">
                    <CardHeader className="text-center pb-8">
                      <CardTitle className="text-3xl font-bold text-gradient">Check your email</CardTitle>
                      <CardDescription className="text-base">
                        We've sent a 6-digit code to{" "}
                        <span className="font-medium text-foreground">{step.email}</span>
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleOtpSubmit}>
                      <CardContent className="pb-6">
                        <input type="hidden" name="email" value={step.email} />
                        <input type="hidden" name="code" value={otp} />

                        <div className="flex justify-center mb-6">
                          <InputOTP
                            value={otp}
                            onChange={setOtp}
                            maxLength={6}
                            disabled={isLoading}
                          >
                            <InputOTPGroup className="gap-3">
                              {Array.from({ length: 6 }).map((_, index) => (
                                <InputOTPSlot 
                                  key={index} 
                                  index={index} 
                                  className="w-12 h-12 text-lg border-primary/20 focus:border-primary"
                                />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                          >
                            {error}
                          </motion.p>
                        )}
                      </CardContent>
                      <CardFooter className="flex-col gap-6">
                        <Button
                          type="submit"
                          size="lg"
                          className="w-full h-12"
                          disabled={isLoading || otp.length !== 6}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            "Verify Code"
                          )}
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                          Didn't receive a code?{" "}
                          <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto text-primary hover:text-primary/80"
                            onClick={() => setStep("signIn")}
                            disabled={isLoading}
                          >
                            Try again
                          </Button>
                        </p>
                      </CardFooter>
                    </form>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}