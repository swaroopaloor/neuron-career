import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  Plus,
  LayoutDashboard,
  Settings,
  Briefcase,
  User,
  Moon,
  Sun,
  LogOut,
  Calendar,
  Star,
  TrendingUp,
  Bell,
  Command
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/use-auth";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: "navigation" | "actions" | "settings" | "recent";
  keywords: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-dashboard",
      title: "Dashboard",
      subtitle: "Go to main dashboard",
      icon: LayoutDashboard,
      action: () => navigate("/dashboard"),
      category: "navigation",
      keywords: ["dashboard", "home", "main"]
    },
    {
      id: "nav-profile",
      title: "Profile Settings",
      subtitle: "Manage your account",
      icon: Settings,
      action: () => navigate("/profile"),
      category: "navigation",
      keywords: ["profile", "settings", "account"]
    },
    {
      id: "nav-job-tracker",
      title: "Job Tracker",
      subtitle: "Track your applications",
      icon: Briefcase,
      action: () => navigate("/job-tracker"),
      category: "navigation",
      keywords: ["jobs", "applications", "tracker"]
    },
    {
      id: "nav-resume-builder",
      title: "Resume Builder",
      subtitle: "Create and edit resumes",
      icon: FileText,
      action: () => navigate("/resume-builder"),
      category: "navigation",
      keywords: ["resume", "builder", "create", "edit"]
    },

    // Actions
    {
      id: "action-new-analysis",
      title: "New Analysis",
      subtitle: "Start a new resume analysis",
      icon: Plus,
      action: () => {
        // This would trigger the upload dialog
        setIsOpen(false);
      },
      category: "actions",
      keywords: ["new", "analysis", "upload", "create"]
    },
    {
      id: "action-notifications",
      title: "View Notifications",
      subtitle: "Check your notifications",
      icon: Bell,
      action: () => {
        // This would open notifications
        setIsOpen(false);
      },
      category: "actions",
      keywords: ["notifications", "alerts", "updates"]
    },

    // Settings
    {
      id: "setting-theme",
      title: "Toggle Theme",
      subtitle: `Switch to ${theme === "light" ? "dark" : "light"} mode`,
      icon: theme === "light" ? Moon : Sun,
      action: () => {
        toggleTheme();
        setIsOpen(false);
      },
      category: "settings",
      keywords: ["theme", "dark", "light", "mode"]
    },
    {
      id: "setting-signout",
      title: "Sign Out",
      subtitle: "Sign out of your account",
      icon: LogOut,
      action: () => {
        signOut();
        setIsOpen(false);
      },
      category: "settings",
      keywords: ["sign out", "logout", "exit"]
    }
  ];

  const filteredCommands = commands.filter(command => {
    if (!query) return true;
    const searchQuery = query.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchQuery) ||
      command.subtitle?.toLowerCase().includes(searchQuery) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery))
    );
  });

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const categoryLabels = {
    navigation: "Navigation",
    actions: "Actions",
    settings: "Settings",
    recent: "Recent"
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const executeCommand = (command: CommandItem) => {
    command.action();
    setIsOpen(false);
    setQuery("");
  };

  return (
    <>
      {/* Trigger hint */}
      <div className="fixed bottom-4 right-4 z-40">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card/90 backdrop-blur border rounded-lg px-3 py-2 shadow-lg"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Command className="h-3 w-3" />
            <span>Press</span>
            <Badge variant="outline" className="px-1 py-0 text-xs">
              ⌘K
            </Badge>
            <span>to open</span>
          </div>
        </motion.div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0 max-w-2xl bg-card/95 backdrop-blur">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col max-h-96"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 text-sm"
                autoFocus
              />
              <Badge variant="outline" className="text-xs">
                ESC
              </Badge>
            </div>

            {/* Commands List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                <AnimatePresence>
                  {Object.entries(groupedCommands).map(([category, items]) => (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 last:mb-0"
                    >
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </div>
                      <div className="space-y-1">
                        {items.map((command, index) => (
                          <motion.button
                            key={command.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => executeCommand(command)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left group"
                          >
                            <div className="flex-shrink-0">
                              <command.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-foreground">
                                {command.title}
                              </div>
                              {command.subtitle && (
                                <div className="text-xs text-muted-foreground">
                                  {command.subtitle}
                                </div>
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredCommands.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No commands found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try searching for something else
                    </p>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
