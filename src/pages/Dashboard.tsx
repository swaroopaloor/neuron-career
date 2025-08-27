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
  Briefcase,
  Calendar,
  Star,
  ArrowRight
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
      {/* Compact Header */}
      <motion.header 
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="bg-card/80 border-b border-border backdrop-blur-lg sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
              <img src="/logo.svg" alt="Logo" width={28} height={28} className="rounded-lg" />
              <h1 className="text-lg font-semibold text-foreground">Resume Analyzer</h1>
            </motion.div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/job-tracker")} className="text-muted-foreground hover:text-foreground px-2">
                <Briefcase className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline text-xs">Jobs</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground px-2">
                <Settings className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline text-xs">Profile</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={isSigningOut} className="text-muted-foreground hover:text-foreground px-2">
                {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4 sm:mr-1" />}
                <span className="hidden sm:inline text-xs">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar - Summary & Actions */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="lg:col-span-1 space-y-4"
          >
            {/* Welcome Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Welcome back!</h2>
                    <p className="text-sm text-muted-foreground">{user?.name?.split(' ')[0] || 'User'}</p>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{analyses?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Analyses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{avgMatchScore}%</div>
                    <div className="text-xs text-muted-foreground">Avg Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{favoritesCount}</div>
                    <div className="text-xs text-muted-foreground">Favorites</div>
                  </div>
                </div>

                {/* Primary CTA */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/job-tracker")}
                  className="w-full justify-start text-left"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Job Tracker
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/profile")}
                  className="w-full justify-start text-left"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Profile Settings
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter("favorites")}
                  className="w-full justify-start text-left"
                >
                  <Star className="h-4 w-4 mr-2" />
                  View Favorites
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Content - Analyses List */}
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
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search analyses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-40 sm:w-48"
                      />
                    </div>
                    
                    {/* Filter Tabs */}
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
                      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        {filter === "favorites" ? (
                          <Heart className="h-8 w-8 text-muted-foreground" />
                        ) : searchQuery ? (
                          <Search className="h-8 w-8 text-muted-foreground" />
                        ) : (
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
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
                        <Button 
                          onClick={() => setUploadDialogOpen(true)}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Analysis
                        </Button>
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
                                <Badge className={`${getStatusColor(analysis.status)} border-0 text-xs`}>
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
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-muted-foreground">Match: </span>
                                    <span className="font-medium text-green-400">{analysis.matchScore}%</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-muted-foreground">ATS: </span>
                                    <span className="font-medium text-blue-400">{analysis.atsScore}%</span>
                                  </div>
                                </div>
                              )}
                              
                              {analysis.status === "failed" && analysis.errorMessage && (
                                <p className="text-sm text-red-400">{analysis.errorMessage}</p>
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

      <UploadDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  );
}