import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate } from "react-router-dom";
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
  MoreHorizontal,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { JOB_STATUSES, JobStatus } from "@/convex/schema";
import { Id } from "@/convex/_generated/dataModel";
import AnalysisReport from "@/components/AnalysisReport";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

type JobApplication = NonNullable<ReturnType<typeof useQuery<typeof api.jobApplications.getJobApplications>>>[number];

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

  const jobApplications = useQuery(api.jobApplications.getJobApplications);
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

  const groupedApplications = JOB_STATUSES.reduce((acc, status) => {
    acc[status] = jobApplications?.filter(app => app.status === status) || [];
    return acc;
  }, {} as Record<JobStatus, typeof jobApplications>);

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
        {/* Stats Overview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          {JOB_STATUSES.map((status) => (
            <Card key={status} className="text-center">
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-2">
                  {getStatusIcon(status)}
                </div>
                <div className="text-2xl font-bold">{groupedApplications[status]?.length || 0}</div>
                <div className="text-sm text-muted-foreground">{status}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Kanban Board */}
        <div className="w-full overflow-x-auto pb-4">
          <div className="grid grid-cols-[repeat(5,minmax(280px,1fr))] md:grid-cols-2 lg:grid-cols-5 gap-6">
            {JOB_STATUSES.map((status, columnIndex) => (
              <motion.div
                key={status}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: columnIndex * 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <h3 className="font-medium text-foreground">{status}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {groupedApplications[status]?.length || 0}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {groupedApplications[status]?.map((job, index) => (
                    <motion.div
                      key={job._id}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: (columnIndex * 0.1) + (index * 0.05) }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm line-clamp-2">{job.jobTitle}</h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {JOB_STATUSES.filter(s => s !== job.status).map(newStatus => (
                                  <DropdownMenuItem
                                    key={newStatus}
                                    onClick={() => handleStatusUpdate(job._id, newStatus)}
                                  >
                                    Move to {newStatus}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingJob(job);
                                    setIsDateDialogOpen(true);
                                  }}
                                >
                                  Edit Dates
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(job._id)}
                                  className="text-destructive"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex items-center gap-1 mb-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{job.companyName}</span>
                          </div>

                          <div className="space-y-1.5 mb-3">
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

                          <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                            {job.status}
                          </Badge>

                          {job.analysisId && (
                            <div className="mt-2 pt-2 border-t">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs"
                                onClick={() => setSelectedAnalysisId(job.analysisId!)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Analysis
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                  {groupedApplications[status]?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No applications in {status.toLowerCase()}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Application Dates</DialogTitle>
            <DialogDescription>
              Set the dates for key milestones in your application process.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Shortlisted Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dates.shortlistedDate ? format(dates.shortlistedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dates.shortlistedDate}
                    onSelect={(date) => setDates(prev => ({ ...prev, shortlistedDate: date as Date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Interview Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dates.interviewDate ? format(dates.interviewDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dates.interviewDate}
                    onSelect={(date) => setDates(prev => ({ ...prev, interviewDate: date as Date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Offer Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dates.offerDate ? format(dates.offerDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dates.offerDate}
                    onSelect={(date) => setDates(prev => ({ ...prev, offerDate: date as Date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
    </div>
  );
}