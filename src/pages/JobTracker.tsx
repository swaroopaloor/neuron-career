// @ts-nocheck
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Building2, 
  Calendar, 
  FileText, 
  ArrowLeft,
  Briefcase,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Id } from "@/convex/_generated/dataModel";
import AnalysisReport from "@/components/AnalysisReport";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type JobApplication = NonNullable<ReturnType<typeof useQuery<typeof api.jobApplications.getJobApplications>>>[number];

type JobStatus = "Saved" | "Applied" | "Interviewing" | "Offer" | "Rejected";
const JOB_STATUSES: readonly JobStatus[] = ["Saved", "Applied", "Interviewing", "Offer", "Rejected"] as const;

const formatDateForInput = (date: Date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
};

export default function JobTracker() {
  const { isLoading, isAuthenticated } = useAuth();
  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [dates, setDates] = useState<{
    shortlistedDate?: Date;
    interviewDate?: Date;
    offerDate?: Date;
  }>({});

  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<Id<"analyses"> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"jobApplications">; title: string } | null>(null);

  const shouldQueryJobs = isAuthenticated && !isLoading;
  const jobApplications = useQuery(
    api.jobApplications.getJobApplications,
    shouldQueryJobs ? {} : undefined
  );
  const createJobApplication = useMutation(api.jobApplications.createJobApplication);
  const updateJobApplication = useMutation(api.jobApplications.updateJobApplication);
  const deleteJobApplication = useMutation(api.jobApplications.deleteJobApplication);

  useEffect(() => {
    if (editingJob) {
      setDates({
        shortlistedDate: editingJob.shortlistedDate ? new Date(editingJob.shortlistedDate) : undefined,
        interviewDate: editingJob.interviewDate ? new Date(editingJob.interviewDate) : undefined,
        offerDate: editingJob.offerDate ? new Date(editingJob.offerDate) : undefined,
      });
    }
  }, [editingJob]);

  const handleCreateJob = async () => {
    if (!jobTitle.trim() || !companyName.trim()) {
      toast.error("Please fill in job title and company name");
      return;
    }

    setIsCreating(true);
    try {
      await createJobApplication({
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        jobDescription: jobDescription.trim() || undefined,
      });

      toast.success("Job application added successfully!");
      setIsAddJobDialogOpen(false);
      setJobTitle("");
      setCompanyName("");
      setJobDescription("");
    } catch (error) {
      console.error("Error creating job application:", error);
      toast.error("Failed to create job application");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusUpdate = async (id: Id<"jobApplications">, status: JobStatus) => {
    try {
      await updateJobApplication({ id, status });
      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDateUpdate = async () => {
    if (!editingJob) return;
    try {
      await updateJobApplication({
        id: editingJob._id,
        shortlistedDate: dates.shortlistedDate?.getTime(),
        interviewDate: dates.interviewDate?.getTime(),
        offerDate: dates.offerDate?.getTime(),
      });
      toast.success("Dates updated successfully!");
      setIsDateDialogOpen(false);
      setEditingJob(null);
    } catch (error) {
      console.error("Error updating dates:", error);
      toast.error("Failed to update dates");
    }
  };

  const handleDelete = async (id: Id<"jobApplications">) => {
    try {
      await deleteJobApplication({ id });
      toast.success("Job application deleted");
    } catch (error) {
      console.error("Error deleting job application:", error);
      toast.error("Failed to delete job application");
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case "Saved": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "Applied": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Interviewing": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Offer": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case "Saved": return <FileText className="h-4 w-4" />;
      case "Applied": return <Target className="h-4 w-4" />;
      case "Interviewing": return <Clock className="h-4 w-4" />;
      case "Offer": return <CheckCircle className="h-4 w-4" />;
      case "Rejected": return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
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

  if (selectedAnalysisId) {
    return (
      <AnalysisReport 
        analysisId={selectedAnalysisId} 
        onBack={() => setSelectedAnalysisId(null)} 
      />
    );
  }

  const groupedApplications = JOB_STATUSES.reduce(
    (acc: Record<JobStatus, typeof jobApplications>, status: JobStatus) => {
      acc[status] = jobApplications?.filter((app) => app.status === status) || [];
      return acc;
    },
    {} as Record<JobStatus, typeof jobApplications>
  );

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
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-semibold text-foreground">Job Application Tracker</h1>
            </div>
            
            <Dialog open={isAddJobDialogOpen} onOpenChange={setIsAddJobDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Job
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Job Application</DialogTitle>
                  <DialogDescription>
                    Track a new job opportunity you're interested in or have applied to.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-title">Job Title *</Label>
                    <Input
                      id="job-title"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name *</Label>
                    <Input
                      id="company-name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Google"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-desc">Job Description (Optional)</Label>
                    <Textarea
                      id="job-desc"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here..."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsAddJobDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateJob} disabled={isCreating}>
                      {isCreating ? "Adding..." : "Add Job"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Board by Status - horizontal columns */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className=""
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 min-h-[60vh]">
            {JOB_STATUSES.map((status, idx) => (
              <div key={status} className="flex flex-col">
                <Card className="h-full border-muted">
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="font-medium">{status}</span>
                      </div>
                      <Badge variant="secondary">
                        {groupedApplications[status]?.length || 0}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {groupedApplications[status]?.map((job, index) => (
                        <motion.div
                          key={job._id}
                          initial={{ y: 8, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: (idx * 0.03) + (index * 0.02) }}
                          layout
                        >
                          <Card className="hover:shadow-sm border-muted">
                            <CardContent className="p-4">
                              {/* Top: Title + Company */}
                              <div className="space-y-1.5 mb-3">
                                <h4 className="font-medium text-sm line-clamp-2">{job.jobTitle}</h4>
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{job.companyName}</span>
                                </div>
                              </div>

                              {/* Middle: Dates summary */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                                {job.applicationDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      Applied: {new Date(job.applicationDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                                {job.shortlistedDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      Shortlisted: {new Date(job.shortlistedDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                                {job.interviewDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      Interview: {new Date(job.interviewDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                                {job.offerDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      Offer: {new Date(job.offerDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Status badge */}
                              <div className="mb-3">
                                <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                                  {job.status}
                                </Badge>
                              </div>

                              {/* Bottom: Actions toolbar */}
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <Select
                                  value={job.status}
                                  onValueChange={(value) => handleStatusUpdate(job._id, value as JobStatus)}
                                >
                                  <SelectTrigger className="h-8 w-36">
                                    <SelectValue placeholder="Set status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {JOB_STATUSES.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingJob(job);
                                      setDates({
                                        shortlistedDate: job.shortlistedDate ? new Date(job.shortlistedDate) : undefined,
                                        interviewDate: job.interviewDate ? new Date(job.interviewDate) : undefined,
                                        offerDate: job.offerDate ? new Date(job.offerDate) : undefined,
                                      });
                                      setIsDateDialogOpen(true);
                                    }}
                                  >
                                    Edit Dates
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive border-destructive/40 hover:bg-destructive/10"
                                    onClick={() => setDeleteTarget({ id: job._id, title: job.jobTitle })}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>

                              {/* Analysis link */}
                              {job.analysisId && (
                                <div className="mt-3 pt-3 border-t">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8"
                                    onClick={() => setSelectedAnalysisId(job.analysisId!)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Analysis
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}

                      {groupedApplications[status]?.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl">
                          No applications in {status.toLowerCase()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </motion.div>

        {!jobApplications?.length && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-16"
          >
            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Job Applications Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start tracking your job applications to stay organized and focused.
            </p>
            <Button onClick={() => setIsAddJobDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Job
            </Button>
          </motion.div>
        )}
      </div>

      {/* Date Picker Dialog */}
      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] pointer-events-auto">
          <DialogHeader>
            <DialogTitle>Edit Application Dates</DialogTitle>
            <DialogDescription>
              Set the dates for key milestones in your application process.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Shortlisted Date</Label>
              <Input
                type="date"
                value={dates.shortlistedDate ? formatDateForInput(dates.shortlistedDate) : ""}
                onChange={(e) =>
                  setDates((prev) => ({
                    ...prev,
                    shortlistedDate: e.target.value ? new Date(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Interview Date</Label>
              <Input
                type="date"
                value={dates.interviewDate ? formatDateForInput(dates.interviewDate) : ""}
                onChange={(e) =>
                  setDates((prev) => ({
                    ...prev,
                    interviewDate: e.target.value ? new Date(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Offer Date</Label>
              <Input
                type="date"
                value={dates.offerDate ? formatDateForInput(dates.offerDate) : ""}
                onChange={(e) =>
                  setDates((prev) => ({
                    ...prev,
                    offerDate: e.target.value ? new Date(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDateUpdate}>
                Save Dates
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job application?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will permanently remove "${deleteTarget.title}". This action cannot be undone.`
                : "This will permanently remove the job application."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) {
                  await handleDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}