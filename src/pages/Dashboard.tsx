import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/ThemeProvider";
import { 
  FileText, 
  Plus, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  LogOut,
  User,
  Loader2,
  Heart,
  Filter,
  Search,
  Sparkles,
  Sun,
  Moon,
  Settings,
  Briefcase
} from "lucide-react";
import { useState } from "react";
import UploadDialog from "@/components/UploadDialog";
import AnalysisReport from "@/components/AnalysisReport";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export default function Dashboard() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<Id<"analyses"> | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  
  const analyses = useQuery(api.analyses.getUserAnalyses, { limit: 10 });
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-900/30 text-green-300";
      case "failed":
        return "bg-red-900/30 text-red-300";
      default:
        return "bg-yellow-900/30 text-yellow-300";
    }
  };

  const filteredAnalyses = analyses?.filter(analysis => 
    filter === "all" ? true : analysis.isFavorited
  ) || [];

  if (selectedAnalysisId) {
    return (
      <AnalysisReport 
        analysisId={selectedAnalysisId} 
        onBack={() => setSelectedAnalysisId(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-card/80 border-b border-border backdrop-blur-lg sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <img
                src="/logo.svg"
                alt="Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <h1 className="text-xl font-semibold text-foreground">Resume Analyzer</h1>
            </motion.div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.name || user?.email || "User"}</span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary smooth-transition"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/job-tracker")}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary smooth-transition px-2 sm:px-3"
              >
                <Briefcase className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Job Tracker</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/profile")}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary smooth-transition px-2 sm:px-3"
              >
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary smooth-transition px-2 sm:px-3"
              >
                {isSigningOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="text-muted-foreground text-lg">
            Ready to optimize your resume and land your dream job?
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div whileHover={{ scale: 1.02, y: -5 }} className="smooth-transition">
            <Card className="bg-secondary/50 elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Analyses</p>
                    <p className="text-3xl font-bold text-foreground">{analyses?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -5 }} className="smooth-transition">
            <Card className="bg-secondary/50 elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Match Score</p>
                    <p className="text-3xl font-bold text-foreground">
                      {analyses && analyses.length > 0
                        ? Math.round(
                            analyses
                              .filter(a => a.status === "completed")
                              .reduce((sum, a) => sum + a.matchScore, 0) /
                            analyses.filter(a => a.status === "completed").length || 1
                          )
                        : 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -5 }} className="smooth-transition">
            <Card className="bg-secondary/50 elevation-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Favorites</p>
                    <p className="text-3xl font-bold text-foreground">
                      {analyses?.filter(a => a.isFavorited).length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* New Analysis Button */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8 text-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setUploadDialogOpen(true)}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 elevation-4 hover:elevation-5 smooth-transition px-8 py-4 text-lg font-semibold ripple"
            >
              <Plus className="h-6 w-6 mr-3" />
              Create New Analysis
            </Button>
          </motion.div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="flex gap-2 justify-center">
            <Button
              variant={filter === "all" ? "default" : "secondary"}
              onClick={() => setFilter("all")}
              className="smooth-transition"
            >
              <FileText className="h-4 w-4 mr-2" />
              All Analyses
            </Button>
            <Button
              variant={filter === "favorites" ? "default" : "secondary"}
              onClick={() => setFilter("favorites")}
              className="smooth-transition"
            >
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </Button>
          </div>
        </motion.div>

        {/* Recent Analyses */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-card border-border elevation-2">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Search className="h-5 w-5" />
                {filter === "all" ? "Recent Analyses" : "Favorite Analyses"}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {filter === "all" 
                  ? "Your most recent resume analyses" 
                  : "Your favorited analyses for quick access"
                }
              </CardDescription>
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
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      {filter === "favorites" ? (
                        <Heart className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {filter === "favorites" ? "No favorites yet" : "No analyses yet"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {filter === "favorites" 
                        ? "Star your favorite analyses to see them here."
                        : "Upload your resume and job description to get started."
                      }
                    </p>
                    {filter === "all" && (
                      <Button 
                        onClick={() => setUploadDialogOpen(true)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 ripple"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Analysis
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {filteredAnalyses.map((analysis, index) => (
                      <motion.div
                        key={analysis._id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.02, x: 10 }}
                        className="bg-secondary/50 border border-border rounded-lg p-4 hover:bg-secondary smooth-transition cursor-pointer group"
                        onClick={() => analysis.status === "completed" && setSelectedAnalysisId(analysis._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(analysis.status)}
                              <Badge className={`${getStatusColor(analysis.status)} border-0`}>
                                {analysis.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(analysis._creationTime).toLocaleDateString()}
                              </span>
                              {analysis.resumeFileName && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                  {analysis.resumeFileName}
                                </span>
                              )}
                              <motion.button
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(analysis._id);
                                }}
                                className="ml-auto"
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
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {analysis.jobDescription.substring(0, 100)}...
                            </p>
                            {analysis.status === "completed" && (
                              <div className="flex gap-4 text-sm">
                                <span className="text-muted-foreground">
                                  Match: <span className="font-medium text-green-400">{analysis.matchScore}%</span>
                                </span>
                                <span className="text-muted-foreground">
                                  ATS: <span className="font-medium text-blue-400">{analysis.atsScore}%</span>
                                </span>
                              </div>
                            )}
                            {analysis.status === "failed" && analysis.errorMessage && (
                              <p className="text-sm text-red-400">{analysis.errorMessage}</p>
                            )}
                          </div>
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

      <UploadDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  );
}