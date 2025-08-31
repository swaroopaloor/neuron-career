import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  Target,
  Award,
  FileText,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity,
  Trophy,
  Zap,
  Heart,
  Clock,
  Users,
  Briefcase,
  Sparkles
} from "lucide-react";

export default function Analytics() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const analytics = useQuery(api.analyses.getDetailedAnalytics);

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

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-8 w-8 border-4 border-primary/20 border-t-primary"
        />
      </div>
    );
  }

  const getMotivationalMessage = () => {
    if (analytics.totalCompleted === 0) {
      return {
        title: "Ready to Start Your Journey! 🚀",
        message: "Every expert was once a beginner. Upload your first resume and see the magic happen!",
        color: "text-blue-600"
      };
    }
    
    if (analytics.successRate >= 80) {
      return {
        title: "Outstanding Performance! 🏆",
        message: "You're crushing it! Your resumes are consistently matching job requirements.",
        color: "text-green-600"
      };
    }
    
    if (analytics.successRate >= 60) {
      return {
        title: "Great Progress! 📈",
        message: "You're on the right track! Keep refining your resumes for even better results.",
        color: "text-purple-600"
      };
    }
    
    if (analytics.avgMatchScore >= 50) {
      return {
        title: "Building Momentum! 💪",
        message: "Every analysis is a step forward. Your improvement journey is just getting started!",
        color: "text-orange-600"
      };
    }
    
    return {
      title: "Every Step Counts! ✨",
      message: "Rome wasn't built in a day. Each analysis brings you closer to your dream job!",
      color: "text-indigo-600"
    };
  };

  const motivational = getMotivationalMessage();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Detailed insights into your resume analysis performance
            </p>
          </div>
        </motion.div>

        {/* Motivational Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center"
                >
                  <Sparkles className="h-6 w-6 text-primary" />
                </motion.div>
                <div>
                  <h2 className={`text-xl font-semibold ${motivational.color}`}>
                    {motivational.title}
                  </h2>
                  <p className="text-muted-foreground">{motivational.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              title: "Total Analyses",
              value: analytics.totalAnalyses,
              subtitle: `${analytics.totalCompleted} completed`,
              icon: FileText,
              color: "text-blue-600",
              bgColor: "bg-blue-50 dark:bg-blue-950/20"
            },
            {
              title: "Success Rate",
              value: `${analytics.successRate}%`,
              subtitle: `${analytics.highMatchAnalyses} high matches`,
              icon: Trophy,
              color: "text-green-600",
              bgColor: "bg-green-50 dark:bg-green-950/20"
            },
            {
              title: "Avg Match Score",
              value: `${analytics.avgMatchScore}%`,
              subtitle: analytics.avgMatchScore >= 70 ? "Excellent!" : "Keep improving",
              icon: Target,
              color: "text-purple-600",
              bgColor: "bg-purple-50 dark:bg-purple-950/20"
            },
            {
              title: "Avg ATS Score",
              value: `${analytics.avgAtsScore}%`,
              subtitle: `${analytics.excellentAtsAnalyses} excellent scores`,
              icon: Award,
              color: "text-orange-600",
              bgColor: "bg-orange-50 dark:bg-orange-950/20"
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.subtitle}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Breakdown
                </CardTitle>
                <CardDescription>
                  Detailed analysis of your resume performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Weekly Trends */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Weekly Progress (Last 4 Weeks)
                  </h3>
                  <div className="space-y-3">
                    {analytics.weeklyData.map((week, index) => (
                      <motion.div
                        key={week.week}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="font-medium">{week.week}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {week.analyses} analyses
                          </span>
                          <Badge variant="outline">
                            {week.avgMatchScore}% avg match
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Success Metrics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Success Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">High Matches</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {analytics.highMatchAnalyses}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        80%+ match score
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Excellent ATS</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {analytics.excellentAtsAnalyses}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        90%+ ATS score
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Side Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            {/* Resume Impact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Resume Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Unique Resumes</span>
                  <Badge variant="outline">{analytics.uniqueResumes}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Job Descriptions</span>
                  <Badge variant="outline">{analytics.uniqueJobDescriptions}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Favorites</span>
                  <Badge variant="outline" className="text-red-600">
                    <Heart className="h-3 w-3 mr-1" />
                    {analytics.favoriteAnalyses}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last 30 Days</span>
                  <Badge variant="secondary">{analytics.recentAnalyses} analyses</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <Badge variant="secondary">{analytics.recentCompleted} finished</Badge>
                </div>
                {analytics.failedAnalyses > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Failed</span>
                    <Badge variant="destructive">{analytics.failedAnalyses}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievement Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.totalAnalyses >= 10 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg"
                  >
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Analysis Pro</span>
                  </motion.div>
                )}
                {analytics.successRate >= 80 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg"
                  >
                    <Award className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">High Achiever</span>
                  </motion.div>
                )}
                {analytics.uniqueResumes >= 5 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Resume Master</span>
                  </motion.div>
                )}
                {analytics.favoriteAnalyses >= 3 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg"
                  >
                    <Heart className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Curator</span>
                  </motion.div>
                )}
                {analytics.totalAnalyses === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Complete analyses to unlock achievements!
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-2">Ready to Improve?</h3>
              <p className="text-muted-foreground mb-4">
                Upload a new resume or analyze against different job descriptions to boost your scores!
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <FileText className="h-4 w-4 mr-2" />
                Start New Analysis
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
