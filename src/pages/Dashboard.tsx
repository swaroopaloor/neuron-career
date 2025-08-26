import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Sparkles
} from "lucide-react";
import { useState } from "react";
import UploadDialog from "@/components/UploadDialog";
import AnalysisReport from "@/components/AnalysisReport";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export default function Dashboard() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
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
      <div className="min-h-screen flex items-center justify-center gradient-primary">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-4 border-white/30 border-t-white"
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
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
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
    <div className="min-h-screen gradient-primary">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass border-b border-white/20 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-white">Resume Analyzer</h1>
            </motion.div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <User className="h-4 w-4" />
                {user?.name || user?.email || "User"}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-white/80 hover:text-white hover:bg-white/10 smooth-transition"
              >
                {isSigningOut ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Sign Out
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
          className="mb-8 text-center"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}! ✨
          </h2>
          <p className="text-white/80 text-lg">
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
          <motion.div whileHover={{ scale: 1.05, y: -5 }} className="smooth-transition">
            <Card className="glass elevation-3 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/70">Total Analyses</p>
                    <p className="text-3xl font-bold text-white">{analyses?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 gradient-accent rounded-full flex items-center justify-center pulse-glow">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, y: -5 }} className="smooth-transition">
            <Card className="glass elevation-3 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/70">Avg Match Score</p>
                    <p className="text-3xl font-bold text-white">
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
                  <div className="w-12 h-12 gradient-secondary rounded-full flex items-center justify-center pulse-glow">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, y: -5 }} className="smooth-transition">
            <Card className="glass elevation-3 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/70">Favorites</p>
                    <p className="text-3xl font-bold text-white">
                      {analyses?.filter(a => a.isFavorited).length || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center pulse-glow">
                    <Heart className="h-6 w-6 text-white" />
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
              className="gradient-accent text-white border-0 elevation-4 hover:elevation-5 smooth-transition px-8 py-4 text-lg font-semibold ripple"
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
              variant={filter === "all" ? "default" : "ghost"}
              onClick={() => setFilter("all")}
              className={`${filter === "all" ? "gradient-primary text-white" : "text-white/70 hover:text-white hover:bg-white/10"} smooth-transition`}
            >
              <FileText className="h-4 w-4 mr-2" />
              All Analyses
            </Button>
            <Button
              variant={filter === "favorites" ? "default" : "ghost"}
              onClick={() => setFilter("favorites")}
              className={`${filter === "favorites" ? "gradient-secondary text-white" : "text-white/70 hover:text-white hover:bg-white/10"} smooth-transition`}
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
          <Card className="glass elevation-3 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5" />
                {filter === "all" ? "Recent Analyses" : "Favorite Analyses"}
              </CardTitle>
              <CardDescription className="text-white/70">
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
                    <div className="w-16 h-16 gradient-accent rounded-full flex items-center justify-center mx-auto mb-4 float">
                      {filter === "favorites" ? (
                        <Heart className="h-8 w-8 text-white" />
                      ) : (
                        <FileText className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      {filter === "favorites" ? "No favorites yet" : "No analyses yet"}
                    </h3>
                    <p className="text-white/70 mb-4">
                      {filter === "favorites" 
                        ? "Star your favorite analyses to see them here."
                        : "Upload your resume and job description to get started."
                      }
                    </p>
                    {filter === "all" && (
                      <Button 
                        onClick={() => setUploadDialogOpen(true)}
                        className="gradient-primary text-white border-0 ripple"
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
                        className="glass border border-white/20 rounded-lg p-4 hover:bg-white/10 smooth-transition cursor-pointer group"
                        onClick={() => analysis.status === "completed" && setSelectedAnalysisId(analysis._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(analysis.status)}
                              <Badge className={`${getStatusColor(analysis.status)} border-0`}>
                                {analysis.status}
                              </Badge>
                              <span className="text-sm text-white/60">
                                {new Date(analysis._creationTime).toLocaleDateString()}
                              </span>
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
                                      ? "text-red-400 fill-red-400" 
                                      : "text-white/40 hover:text-red-400"
                                  }`} 
                                />
                              </motion.button>
                            </div>
                            <p className="text-sm text-white/80 line-clamp-2 mb-2">
                              {analysis.jobDescription.substring(0, 100)}...
                            </p>
                            {analysis.status === "completed" && (
                              <div className="flex gap-4 text-sm">
                                <span className="text-white/60">
                                  Match: <span className="font-medium text-green-400">{analysis.matchScore}%</span>
                                </span>
                                <span className="text-white/60">
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