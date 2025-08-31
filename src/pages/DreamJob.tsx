import { motion } from "framer-motion";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Briefcase, 
  Zap,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Code,
  Users,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function DreamJob() {
  const dreamJobAnalysis = useQuery(api.analyses.getDreamJobAnalysis);
  const generateInsights = useAction(api.aiCareerGrowth.generateGrowthInsights);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const handleGenerateInsights = async () => {
    if (!dreamJobAnalysis) return;

    setIsGeneratingInsights(true);
    try {
      // Get resume content from storage
      const resumeUrl = await fetch(`/api/storage/${dreamJobAnalysis.resumeFileId}`);
      const resumeContent = await resumeUrl.text();

      await generateInsights({
        resumeContent,
        jobDescription: dreamJobAnalysis.jobDescription,
        analysisId: dreamJobAnalysis._id,
      });

      toast("Growth insights generated successfully! 🚀");
    } catch (error) {
      console.error("Failed to generate insights:", error);
      toast.error("Failed to generate insights. Please try again.");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const hasInsights = dreamJobAnalysis?.lackingSkills || dreamJobAnalysis?.lackingEducation || dreamJobAnalysis?.lackingExperience || dreamJobAnalysis?.growthPlan;

  if (dreamJobAnalysis === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your dream job...</p>
        </div>
      </div>
    );
  }

  if (!dreamJobAnalysis) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <Star className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Your Dream Job Awaits
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Set a dream job to get personalized insights on the skills, education, and experience you need to land your perfect role.
            </p>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                To get started, analyze a resume against a job description and mark it as your dream job.
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Link to="/dashboard">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Analysis
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-white fill-current" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Dream Job Analysis</h1>
            </div>
            
            <div className="ml-auto">
              {!hasInsights && (
                <Button
                  onClick={handleGenerateInsights}
                  disabled={isGeneratingInsights}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isGeneratingInsights ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Insights...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Growth Insights
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dream Job Overview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="elevation-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl text-purple-900 dark:text-purple-100 mb-2">
                    Your Dream Job
                  </CardTitle>
                  <CardDescription className="text-purple-700 dark:text-purple-300">
                    Based on your analysis from {new Date(dreamJobAnalysis._creationTime).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Dream Job ✨
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-900 dark:text-purple-100">Match Score</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {dreamJobAnalysis.matchScore}%
                  </div>
                  <Progress value={dreamJobAnalysis.matchScore} className="h-2" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-900 dark:text-purple-100">ATS Score</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {dreamJobAnalysis.atsScore}%
                  </div>
                  <Progress value={dreamJobAnalysis.atsScore} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {hasInsights ? (
          <div className="space-y-8">
            {/* Gap Analysis */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-orange-500" />
                Gap Analysis
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lacking Skills */}
                <Card className="elevation-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Code className="h-5 w-5 text-blue-500" />
                      Skills to Develop
                    </CardTitle>
                    <CardDescription>
                      Technical and soft skills you need to acquire
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dreamJobAnalysis.lackingSkills && dreamJobAnalysis.lackingSkills.length > 0 ? (
                      <div className="space-y-2">
                        {dreamJobAnalysis.lackingSkills.map((skill, index) => (
                          <motion.div
                            key={skill}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <Badge variant="outline" className="w-full justify-start p-3 text-sm">
                              {skill}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No skill gaps identified
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Lacking Education */}
                <Card className="elevation-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <GraduationCap className="h-5 w-5 text-green-500" />
                      Education & Certifications
                    </CardTitle>
                    <CardDescription>
                      Qualifications and certifications to pursue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dreamJobAnalysis.lackingEducation && dreamJobAnalysis.lackingEducation.length > 0 ? (
                      <div className="space-y-2">
                        {dreamJobAnalysis.lackingEducation.map((education, index) => (
                          <motion.div
                            key={education}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <Badge variant="outline" className="w-full justify-start p-3 text-sm">
                              {education}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No education gaps identified
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Lacking Experience */}
                <Card className="elevation-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Briefcase className="h-5 w-5 text-purple-500" />
                      Experience to Gain
                    </CardTitle>
                    <CardDescription>
                      Professional experience areas to focus on
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dreamJobAnalysis.lackingExperience && dreamJobAnalysis.lackingExperience.length > 0 ? (
                      <div className="space-y-2">
                        {dreamJobAnalysis.lackingExperience.map((experience, index) => (
                          <motion.div
                            key={experience}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <Badge variant="outline" className="w-full justify-start p-3 text-sm">
                              {experience}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No experience gaps identified
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Growth Plan */}
            {dreamJobAnalysis.growthPlan && dreamJobAnalysis.growthPlan.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                  Your Growth Roadmap
                </h2>
                
                <div className="space-y-6">
                  {dreamJobAnalysis.growthPlan.map((milestone, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card className="elevation-2 hover:elevation-3 transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-foreground">
                                  {milestone.milestone}
                                </h3>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {milestone.timeline}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground leading-relaxed">
                                {milestone.details}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Ready to Unlock Your Growth Plan?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Generate personalized insights to understand exactly what skills, education, and experience you need to land your dream job.
            </p>
            <Button
              onClick={handleGenerateInsights}
              disabled={isGeneratingInsights}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isGeneratingInsights ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Your Growth Plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Growth Insights
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Job Description */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="elevation-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Original Job Description
              </CardTitle>
              <CardDescription>
                The job description for your dream role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                  {dreamJobAnalysis.jobDescription}
                </pre>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
