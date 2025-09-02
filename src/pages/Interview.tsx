import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import InterviewCoach from "@/components/InterviewCoach";
import { Sparkles } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function Interview() {
  const { isLoading, isAuthenticated } = useAuth();

  // Selection state
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [newJobJd, setNewJobJd] = useState("");

  // Load user's analyses (guarded; avoids throwing when not authenticated)
  const analyses = useQuery(api.analyses.getUserAnalyses, isAuthenticated ? { limit: 50 } : "skip");

  const selectedAnalysis = useMemo(() => {
    if (!analyses || !selectedAnalysisId) return null;
    return analyses.find((a: any) => a._id === selectedAnalysisId) || null;
  }, [analyses, selectedAnalysisId]);

  const effectiveJd = mode === "existing" ? (selectedAnalysis?.jobDescription || "") : newJobJd;

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
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="h-6 w-6 text-primary" />
                Interview Studio
              </CardTitle>
              <CardDescription>
                Practice smarter: choose a JD and get tailored questions, real-time voice feedback, and polished answers.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                <Badge variant="secondary">Real-time metrics</Badge>
                <Badge variant="secondary">Tailored Q&A</Badge>
                <Badge variant="secondary">Follow-ups</Badge>
                <Badge variant="secondary">AI polishing</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Selection + Tips */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Setup</CardTitle>
                <CardDescription>Select a source for your practice session.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={mode}
                  onValueChange={(v: "existing" | "new") => {
                    setMode(v);
                  }}
                  className="grid grid-cols-1 gap-3"
                >
                  <Label
                    htmlFor="existing"
                    className={`border rounded-md p-3 cursor-pointer flex items-start gap-3 ${
                      mode === "existing" ? "border-primary" : ""
                    }`}
                  >
                    <RadioGroupItem id="existing" value="existing" className="mt-0.5" />
                    <div>
                      <div className="font-medium">Use an existing analysis</div>
                      <div className="text-xs text-muted-foreground">
                        Pick from your past resume analyses
                      </div>
                    </div>
                  </Label>

                  <Label
                    htmlFor="new"
                    className={`border rounded-md p-3 cursor-pointer flex items-start gap-3 ${
                      mode === "new" ? "border-primary" : ""
                    }`}
                  >
                    <RadioGroupItem id="new" value="new" className="mt-0.5" />
                    <div>
                      <div className="font-medium">Practice for a new job</div>
                      <div className="text-xs text-muted-foreground">
                        Paste the job description
                      </div>
                    </div>
                  </Label>
                </RadioGroup>

                <Separator />

                {mode === "existing" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Your Analyses</div>
                      <Badge variant="outline">
                        {analyses ? analyses.length : 0}
                      </Badge>
                    </div>
                    {!analyses ? (
                      <div className="text-xs text-muted-foreground">Loading...</div>
                    ) : analyses.length === 0 ? (
                      <div className="text-xs text-muted-foreground">
                        No analyses yet. Go to Dashboard and run your first analysis.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto">
                        {analyses.map((a: any) => (
                          <button
                            key={a._id}
                            onClick={() => setSelectedAnalysisId(a._id)}
                            className={`text-left rounded-md border p-2 text-xs hover:bg-secondary transition ${
                              selectedAnalysisId === a._id ? "border-primary" : "border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">Analysis</span>
                              <Badge variant="outline">
                                {a.matchScore}% match • {a.atsScore}% ATS
                              </Badge>
                            </div>
                            <div className="line-clamp-3 text-muted-foreground">
                              {a.jobDescription}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedAnalysis && (
                      <div className="rounded-md border p-2 text-xs bg-secondary/30">
                        Selected JD will auto-fill the coach.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Job Description</div>
                    <Textarea
                      value={newJobJd}
                      onChange={(e) => setNewJobJd(e.target.value)}
                      placeholder="Paste the job description here..."
                      className="min-h-32"
                    />
                    <div className="text-xs text-muted-foreground">
                      This will tailor questions and polishing.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="sticky top-[420px]">
              <CardHeader>
                <CardTitle className="text-lg">Tips</CardTitle>
                <CardDescription>Boost your performance quickly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-md border p-3">
                  Speak naturally; aim for 110–150 WPM.
                </div>
                <div className="rounded-md border p-3">
                  Use STAR implicitly and quantify impact.
                </div>
                <div className="rounded-md border p-3">
                  Ask a follow-up to deepen your narrative.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Interactive Coach */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview Coach</CardTitle>
                <CardDescription>
                  Voice Mirror for real-time feedback and AMA for JD-based practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InterviewCoach jobDescription={effectiveJd || undefined} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}