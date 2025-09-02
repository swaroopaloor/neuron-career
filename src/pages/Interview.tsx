import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import InterviewCoach from "@/components/InterviewCoach";
import { Sparkles } from "lucide-react";

export default function Interview() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Interview
            </h1>
            <p className="text-muted-foreground">
              Practice interviews with real-time coaching and JD-specific Q&A
            </p>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Interview Coach</CardTitle>
            <CardDescription>
              Voice Mirror for real-time feedback and Ask Me Anything for JD-based practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InterviewCoach />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
