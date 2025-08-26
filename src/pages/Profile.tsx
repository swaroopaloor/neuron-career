import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/ThemeProvider";
import { 
  User, 
  Upload, 
  FileText, 
  Sun, 
  Moon, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  X
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const savedResumeUrl = useQuery(api.users.getSavedResumeUrl);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.fileUpload.generateUploadUrl);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      let resumeFileId = user?.savedResumeId;
      let resumeFileName = user?.savedResumeName;

      // Upload new resume if selected
      if (file) {
        setIsUploading(true);
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          body: file,
        });

        if (!result.ok) throw new Error("Failed to upload file");
        const { storageId } = await result.json();
        resumeFileId = storageId;
        resumeFileName = file.name;
        setFile(null);
        setIsUploading(false);
      }

      await updateProfile({
        name: name.trim() || undefined,
        savedResumeId: resumeFileId,
        savedResumeName: resumeFileName,
      });

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
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
              <h1 className="text-xl font-semibold text-foreground">Profile Settings</h1>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="hover:bg-accent"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4 mr-2" />
              ) : (
                <Sun className="h-4 w-4 mr-2" />
              )}
              {theme === "light" ? "Dark" : "Light"} Mode
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="space-y-8"
        >
          {/* Personal Information */}
          <Card className="elevation-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Saved Resume */}
          <Card className="elevation-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Default Resume
              </CardTitle>
              <CardDescription>
                Save a default resume to use for quick analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.savedResumeId && (
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{user.savedResumeName || "Saved Resume"}</p>
                      <p className="text-sm text-muted-foreground">Currently saved resume</p>
                    </div>
                  </div>
                  {savedResumeUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(savedResumeUrl, '_blank')}
                    >
                      View
                    </Button>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="resume">Upload New Resume (PDF, max 5MB)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="flex-1"
                  />
                  {file && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card className="elevation-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === "light" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Choose between light and dark mode
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={toggleTheme}
                  className="flex items-center gap-2"
                >
                  {theme === "light" ? (
                    <>
                      <Moon className="h-4 w-4" />
                      Switch to Dark
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4" />
                      Switch to Light
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving || isUploading}
              size="lg"
              className="px-8"
            >
              {isSaving || isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
