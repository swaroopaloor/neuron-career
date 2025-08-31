import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import UploadDialog from "@/components/UploadDialog";
import AnalysisReport from "@/components/AnalysisReport";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useState } from "react";
import {
  FileText,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Heart,
  Search,
  Sparkles,
  Settings,
  Briefcase,
  Calendar,
  Star,
  ArrowRight,
  Target,
  Award,
  BarChart3,
  Activity
} from "lucide-react";

export default function Dashboard() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<Id<"analyses"> | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const analyses = useQuery(api.analyses.getUserAnalyses, { limit: 20 });
  const toggleFavorite = useMutation(api.analyses.toggleFavorite);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleToggleFavorite = async (analysisId: Id<"analyses">) => {
    try {
      await toggleFavorite({ id: analysisId });
      toast.success("Updated favorites!");
    } catch (error) {
      toast.error("Failed to update favorite");
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-primary/10 text-primary border-primary/20";
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const filteredAnalyses = analyses?.filter(analysis => {
    const matchesFilter = filter === "all" ? true : analysis.isFavorited;
    const matchesSearch = searchQuery === "" || 
      analysis.jobDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (analysis.resumeFileName && analysis.resumeFileName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  }) || [];

  const completedAnalyses = analyses?.filter(a => a.status === "completed") || [];
  const avgMatchScore = completedAnalyses.length > 0 
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + a.matchScore, 0) / completedAnalyses.length)
    : 0;
  const favoritesCount = analyses?.filter(a => a.isFavorited).length || 0;

  const totalAnalyses = analyses?.length || 0;
  const recentAnalyses = analyses?.filter(a => {
    const daysDiff = (Date.now() - a._creationTime) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }).length || 0;
  
  const highMatchAnalyses = completedAnalyses.filter(a => a.matchScore >= 80).length;
  const matchRate = completedAnalyses.length > 0 
    ? Math.round((highMatchAnalyses / completedAnalyses.length) * 100)
    : 0;

  if (selectedAnalysisId) {
    return (
      <AnalysisReport 
        analysisId={selectedAnalysisId} 
        onBack={() => setSelectedAnalysisId(null)} 
      />
    );
  }

  const isNewUser = !analyses || analyses.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isNewUser ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-8"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Welcome to Resume Analyzer!
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Get AI-powered insights on your resume, match scores for job descriptions, 
                and personalized interview preparation - all in one place.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto"
            >
              <Card className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Upload Resume</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your resume and get instant AI analysis
                </p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Get Match Score</h3>
                <p className="text-sm text-muted-foreground">
                  See how well your resume matches job descriptions
                </p>
              </Card>
              
              <Card className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Interview Prep</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized questions and talking points
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setUploadDialogOpen(true)}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 py-3 text-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Start Your First Analysis
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-sm text-muted-foreground mt-6"
            >
              It takes less than 2 minutes to get your first analysis
            </motion.p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[
                {
                  title: "Total Analyses",
                  value: totalAnalyses,
                  change: recentAnalyses > 0 ? `+${recentAnalyses} this week` : "No recent activity",
                  icon: FileText,
                  color: "text-blue-600",
                  bgColor: "bg-blue-50 dark:bg-blue-950/20"
                },
                {
                  title: "Avg Match Score",
                  value: `${avgMatchScore}%`,
                  change: avgMatchScore >= 70 ? "Excellent!" : avgMatchScore >= 50 ? "Good progress" : "Room to improve",
                  icon: Target,
                  color: "text-green-600",
                  bgColor: "bg-green-50 dark:bg-green-950/20"
                },
                {
                  title: "High Matches",
                  value: `${matchRate}%`,
                  change: `${highMatchAnalyses} of ${completedAnalyses.length} analyses`,
                  icon: Award,
                  color: "text-purple-600",
                  bgColor: "bg-purple-50 dark:bg-purple-950/20"
                },
                {
                  title: "Favorites",
                  value: favoritesCount,
                  change: favoritesCount > 0 ? "Saved for later" : "Star your best matches",
                  icon: Heart,
                  color: "text-red-600",
                  bgColor: "bg-red-50 dark:bg-red-950/20"
                }
              ].map((kpi, index) => (
                <motion.div
                  key={kpi.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="relative overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            {kpi.title}
                          </p>
                          <p className="text-2xl font-bold text-foreground">
                            {kpi.value}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {kpi.change}
                          </p>
                        </div>
                        <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                          <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                        </div>
                      </div>
                      
                      <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                        <kpi.icon className="w-full h-full" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="lg:col-span-1 space-y-4"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div 
                          className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <User className="h-5 w-5 text-primary" />
                        </motion.div>
                        <div>
                          <h2 className="font-semibold text-foreground">Welcome back!</h2>
                          <p className="text-sm text-muted-foreground">{user?.name?.split(' ')[0] || 'User'}</p>
                        </div>
                      </div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <Button
                          onClick={() => setUploadDialogOpen(true)}
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Analysis
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { icon: Briefcase, label: "Job Tracker", action: () => navigate("/job-tracker") },
                        { icon: Settings, label: "Profile Settings", action: () => navigate("/profile") },
                        { icon: Star, label: "View Favorites", action: () => setFilter("favorites") },
                        { icon: BarChart3, label: "Analytics", action: () => {} }
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          whileHover={{ x: 5 }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={item.action}
                            className="w-full justify-start text-left"
                          >
                            <item.icon className="h-4 w-4 mr-2" />
                            {item.label}
                            <ArrowRight className="h-3 w-3 ml-auto" />
                          </Button>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analyses?.slice(0, 3).map((analysis, index) => (
                          <motion.div
                            key={analysis._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="flex items-center gap-2 text-sm"
                          >
                            {getStatusIcon(analysis.status)}
                            <span className="text-muted-foreground truncate">
                              {analysis.jobDescription.substring(0, 30)}...
                            </span>
                          </motion.div>
                        ))}
                        {(!analyses || analyses.length === 0) && (
                          <p className="text-xs text-muted-foreground">No recent activity</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-3"
              >
                <Card className="h-fit">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Your Analyses
                        </CardTitle>
                        <CardDescription>
                          {filter === "all" ? "All your resume analyses" : "Your favorited analyses"}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search analyses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 w-40 sm:w-48"
                          />
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant={filter === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter("all")}
                          >
                            All
                          </Button>
                          <Button
                            variant={filter === "favorites" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter("favorites")}
                          >
                            <Heart className="h-3 w-3 mr-1" />
                            Favorites
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <AnimatePresence mode="wait">
                      {!filteredAnalyses || filteredAnalyses.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="text-center py-12"
                        >
                          <motion.div 
                            className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {filter === "favorites" ? (
                              <Heart className="h-8 w-8 text-muted-foreground" />
                            ) : searchQuery ? (
                              <Search className="h-8 w-8 text-muted-foreground" />
                            ) : (
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            )}
                          </motion.div>
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            {searchQuery ? "No matching analyses" : 
                             filter === "favorites" ? "No favorites yet" : "No analyses yet"}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {searchQuery ? "Try adjusting your search terms." :
                             filter === "favorites" ? "Star your favorite analyses to see them here." :
                             "Upload your resume and job description to get started."}
                          </p>
                          {filter === "all" && !searchQuery && (
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button 
                                onClick={() => setUploadDialogOpen(true)}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Analysis
                              </Button>
                            </motion.div>
                          )}
                        </motion.div>
                      ) : (
                        <div className="space-y-3">
                          {filteredAnalyses.map((analysis, index) => (
                            <motion.div
                              key={analysis._id}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.05 * index }}
                              whileHover={{ scale: 1.01, x: 5 }}
                              className="bg-secondary/30 border border-border rounded-lg p-4 hover:bg-secondary/50 smooth-transition cursor-pointer group"
                              onClick={() => analysis.status === "completed" && setSelectedAnalysisId(analysis._id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    {getStatusIcon(analysis.status)}
                                    <Badge className={`${getStatusColor(analysis.status)} border text-xs`}>
                                      {analysis.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(analysis._creationTime).toLocaleDateString()}
                                    </span>
                                    {analysis.resumeFileName && (
                                      <Badge variant="outline" className="text-xs">
                                        {analysis.resumeFileName.length > 15 
                                          ? analysis.resumeFileName.substring(0, 15) + "..." 
                                          : analysis.resumeFileName}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {analysis.jobDescription.substring(0, 120)}...
                                  </p>
                                  
                                  {analysis.status === "completed" && (
                                    <div className="flex gap-4 text-sm">
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                        <span className="text-muted-foreground">Match: </span>
                                        <span className="font-medium text-primary">{analysis.matchScore}%</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-secondary-foreground rounded-full"></div>
                                        <span className="text-muted-foreground">ATS: </span>
                                        <span className="font-medium text-secondary-foreground">{analysis.atsScore}%</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {analysis.status === "failed" && analysis.errorMessage && (
                                    <p className="text-sm text-destructive">{analysis.errorMessage}</p>
                                  )}
                                </div>
                                
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(analysis._id);
                                  }}
                                  className="ml-3 flex-shrink-0"
                                >
                                  <Heart 
                                    className={`h-5 w-5 smooth-transition ${
                                      analysis.isFavorited 
                                        ? "text-red-500 fill-red-500" 
                                        : "text-muted-foreground/50 hover:text-red-500"
                                    }`} 
                                  />
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      <UploadDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  );
}