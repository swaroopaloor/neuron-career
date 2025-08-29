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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

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

const resumeFacts = [
  "Your resume is your first impression - make it count with professional presentation",
  "Top candidates spend 5x more time refining their resumes than average applicants",
  "A well-crafted resume increases interview chances by 70% according to industry studies",
  "Recruiters spend only 6 seconds on initial resume screening - every detail matters"
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prevIndex) => (prevIndex + 1) % resumeFacts.length);
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

    if (!acceptedTerms) {
      setIsLoading(false);
      setError("Please accept the Terms & Conditions and Privacy Policy to continue.");
      return;
    }

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
    <div className="min-h-[100svh] w-full relative overflow-hidden">
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

      {/* New Fixed Back Button - prevents overlap and stays consistent */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-40">
        <div className="pointer-events-auto px-4 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="h-9 rounded-full bg-background/70 backdrop-blur border border-white/10 hover:bg-background/90 text-muted-foreground hover:text-foreground shadow-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Main container: balanced gap and alignment */}
      <div className="relative z-10 container max-w-5xl mx-auto px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-2 min-h-[100svh] items-center gap-4 lg:gap-6 py-8">
        {/* Subtle center divider for desktop to add structure */}
        <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[70%] w-px bg-white/10" />

        {/* Left side - Feature showcase */}
        <div className="flex flex-col items-center justify-center p-1 sm:p-2 lg:p-3 text-center relative order-last lg:order-first">
          {/* Constrain left column content width for balance with form */}
          <div className="w-full max-w-lg mx-auto">
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-2 sm:mb-3"
            >
              <img
                src="/logo_bg.svg"
                alt="Logo"
                width={84}
                height={84}
                className="mx-auto mb-2 w-10 h-10 sm:w-12 sm:h-12"
              />
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-gradient mb-2">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                Join thousands of professionals who've accelerated their careers with our AI-powered platform
              </p>
            </motion.div>

            {/* Feature Carousel */}
            <div className="relative w-full max-w-md mb-3 h-28 sm:h-32 md:h-36">
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
                    <CardContent className="flex flex-col items-center justify-center h-full p-6 sm:p-7 text-center">
                      <div className="mb-5 p-3 bg-background/50 rounded-2xl shadow-lg [&>svg]:h-10 [&>svg]:w-10">
                        {features[featureIndex].icon}
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-3">
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
            <div className="flex justify-center gap-1 mb-2">
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
            <div className="relative w-full max-w-md px-1 mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonialIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 text-center"
                >
                  <div className="text-center text-sm font-medium text-foreground px-4 py-3 bg-background/70 rounded-lg border border-primary/10">
                    "{resumeFacts[testimonialIndex]}"
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="flex items-center justify-center py-2 px-2 sm:px-3 lg:px-4 relative">
          {/* Back Button (hidden now, replaced by fixed button above) */}
          <header className="sr-only">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </header>

          <div className="w-full max-w-md mt-0">
            <AnimatePresence mode="wait">
              {step === "signIn" ? (
                <motion.div
                  key="signIn"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.995 }}
                >
                  <Card className="glass-card border-primary/20 shadow-2xl">
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-lg font-bold text-gradient">Get Started</CardTitle>
                      <CardDescription className="text-sm">
                        Enter your email to log in or create an account
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleEmailSubmit}>
                      <CardContent className="space-y-2.5">
                        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="relative flex-1 w-full">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              name="email"
                              placeholder="name@example.com"
                              type="email"
                              className="pl-12 h-9 text-xs sm:text-sm border-primary/20 focus:border-primary"
                              disabled={isLoading}
                              required
                            />
                          </div>
                          <Button
                            type="submit"
                            size="sm"
                            className="h-9 px-4 w-full sm:w-auto"
                            disabled={isLoading || !acceptedTerms}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowRight className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl bg-background/80 p-4 border border-primary/20 shadow-sm">
                          <Checkbox
                            id="accept-terms"
                            checked={acceptedTerms}
                            onCheckedChange={(v) => setAcceptedTerms(Boolean(v))}
                            disabled={isLoading}
                          />
                          <div className="space-y-1">
                            <Label htmlFor="accept-terms" className="text-sm font-medium">
                              I agree to the{" "}
                              <button
                                type="button"
                                className="underline underline-offset-2 text-primary hover:text-primary/80"
                                onClick={() => setTermsOpen(true)}
                              >
                                Terms & Conditions
                              </button>{" "}
                              and{" "}
                              <button
                                type="button"
                                className="underline underline-offset-2 text-primary hover:text-primary/80"
                                onClick={() => setTermsOpen(true)}
                              >
                                Privacy Policy
                              </button>
                              .
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              You must accept to continue.
                            </p>
                          </div>
                        </div>

                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs sm:text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg"
                          >
                            {error}
                          </motion.p>
                        )}

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-primary/20" />
                          </div>
                          <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                            <span className="bg-card px-3 text-muted-foreground font-medium">
                              Or continue with
                            </span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-9 border-primary/20 hover:border-primary"
                          onClick={handleGuestLogin}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                          ) : (
                            <UserX className="mr-3 h-4 w-4" />
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
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.995 }}
                >
                  <Card className="glass-card border-primary/20 shadow-2xl">
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-base font-bold text-gradient">Check your email</CardTitle>
                      <CardDescription className="text-sm">
                        We've sent a 6-digit code to{" "}
                        <span className="font-medium text-foreground">{step.email}</span>
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleOtpSubmit}>
                      <CardContent className="pb-3">
                        <input type="hidden" name="email" value={step.email} />
                        <input type="hidden" name="code" value={otp} />

                        <div className="flex justify-center mb-5">
                          <InputOTP
                            value={otp}
                            onChange={setOtp}
                            maxLength={6}
                            disabled={isLoading}
                          >
                            <InputOTPGroup className="gap-2">
                              {Array.from({ length: 6 }).map((_, index) => (
                                <InputOTPSlot
                                  key={index}
                                  index={index}
                                  className="w-8 h-9 text-sm border-primary/20 focus:border-primary"
                                />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs sm:text-sm text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg"
                          >
                            {error}
                          </motion.p>
                        )}
                      </CardContent>
                      <CardFooter className="flex-col gap-4">
                        <Button
                          type="submit"
                          size="sm"
                          className="w-full h-9"
                          disabled={isLoading || otp.length !== 6}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            "Verify Code"
                          )}
                        </Button>
                        <p className="text-xs sm:text-sm text-muted-foreground text-center">
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

      {/* Terms & Conditions Dialog */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Terms & Conditions</DialogTitle>
            <DialogDescription>
              Please review the following terms. By accepting, you agree to our Terms & Conditions and Privacy Policy.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[40vh] overflow-y-auto space-y-4 text-sm leading-relaxed">
            <p>
              Welcome to our platform. By creating an account or using our services, you agree to the following terms. 
              We process your data solely to provide resume analysis, job tracking, and related features. We never sell your data.
            </p>
            <p>
              You are responsible for the content you upload. Do not upload confidential or proprietary content without permission.
              We may update these terms; continued use signifies acceptance of any changes.
            </p>
            <p>
              Security: We use industry-standard encryption and secure storage for files and personal data. 
              For details on how we handle your data, please review our Privacy Policy.
            </p>
            <p>
              Limitation of Liability: Our services are provided "as is" without warranties. 
              We are not liable for indirect or incidental damages arising from use of the platform.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTermsOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setAcceptedTerms(true);
                setTermsOpen(false);
              }}
            >
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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