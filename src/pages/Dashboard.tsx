import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
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
  Loader2
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
  
  const analyses = useQuery(api.analyses.getUserAnalyses, { limit: 10 });

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  if (selectedAnalysisId) {
    return (
      <AnalysisReport 
        analysisId={selectedAnalysisId} 
        onBack={() => setSelectedAnalysisId(null)} 
      />
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
      <header className="border-b bg-card elevation-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src="./logo.svg"
                alt="Resume Analyzer"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <h1 className="text-xl font-medium text-foreground">Resume Analyzer</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {user?.name || user?.email || "User"}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-muted-foreground hover:text-foreground"
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
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back!
          </h2>
          <p className="text-muted-foreground">
            Analyze your resume against job descriptions to improve your chances of getting hired.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="elevation-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Analyses</p>
                  <p className="text-2xl font-bold text-foreground">{analyses?.length || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="elevation-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Match Score</p>
                  <p className="text-2xl font-bold text-foreground">
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
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="elevation-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg ATS Score</p>
                  <p className="text-2xl font-bold text-foreground">
                    {analyses && analyses.length > 0
                      ? Math.round(
                          analyses
                            .filter(a => a.status === "completed")
                            .reduce((sum, a) => sum + a.atsScore, 0) /
                          analyses.filter(a => a.status === "completed").length || 1
                        )
                      : 0}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* New Analysis Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Button
            onClick={() => setUploadDialogOpen(true)}
            size="lg"
            className="ripple elevation-2 hover:elevation-3 transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Analysis
          </Button>
        </motion.div>

        {/* Recent Analyses */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="elevation-2">
            <CardHeader>
              <CardTitle>Recent Analyses</CardTitle>
              <CardDescription>
                Your 10 most recent resume analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!analyses || analyses.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No analyses yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your resume and job description to get started.
                  </p>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyses.map((analysis, index) => (
                    <motion.div
                      key={analysis._id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * index }}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => analysis.status === "completed" && setSelectedAnalysisId(analysis._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(analysis.status)}
                            <Badge className={getStatusColor(analysis.status)}>
                              {analysis.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(analysis._creationTime).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground line-clamp-2 mb-2">
                            {analysis.jobDescription.substring(0, 100)}...
                          </p>
                          {analysis.status === "completed" && (
                            <div className="flex gap-4 text-sm">
                              <span className="text-muted-foreground">
                                Match: <span className="font-medium text-foreground">{analysis.matchScore}%</span>
                              </span>
                              <span className="text-muted-foreground">
                                ATS: <span className="font-medium text-foreground">{analysis.atsScore}%</span>
                              </span>
                            </div>
                          )}
                          {analysis.status === "failed" && analysis.errorMessage && (
                            <p className="text-sm text-red-600">{analysis.errorMessage}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <UploadDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen}
      />
    </motion.div>
  );
}