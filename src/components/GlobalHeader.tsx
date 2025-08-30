import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/ThemeProvider";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Sun, 
  Moon, 
  Menu, 
  LogOut, 
  Loader2,
  Sparkles,
  FileText,
  LayoutDashboard,
  Settings,
  ChevronLeft
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { toast } from "sonner";

export function GlobalHeader() {
  const { isAuthenticated, user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out failed:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard
    },
    {
      label: "Resume Builder",
      path: "/resume-builder",
      icon: FileText
    },
    {
      label: "Profile",
      path: "/profile",
      icon: Settings
    }
  ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-card/95 border-b border-border backdrop-blur-lg sticky top-0 z-50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Minimal top bar */}
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-2">
            {/* Collapsible left sidebar */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open Menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="flex flex-col h-full">
                  {/* User info */}
                  <div className="flex items-center gap-3 pb-6 border-b">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{user?.name || "User"}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  {/* Navigation */}
                  <nav className="flex flex-col gap-2 py-6 flex-1">
                    {navItems.map((item) => (
                      <SheetClose key={item.path} asChild>
                        <Button
                          variant={isActivePath(item.path) ? "default" : "ghost"}
                          size="lg"
                          asChild
                          className="justify-start"
                        >
                          <Link to={item.path} className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            {item.label}
                          </Link>
                        </Button>
                      </SheetClose>
                    ))}
                    {/* Back button in sidebar */}
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={handleBack}
                      className="justify-start text-muted-foreground"
                    >
                      <ChevronLeft className="h-5 w-5 mr-2" />
                      Back
                    </Button>

                    {/* Theme toggle in sidebar */}
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={toggleTheme}
                      className="justify-start text-muted-foreground"
                    >
                      {theme === "light" ? (
                        <Moon className="h-5 w-5 mr-2" />
                      ) : (
                        <Sun className="h-5 w-5 mr-2" />
                      )}
                      Toggle Theme
                    </Button>
                  </nav>

                  {/* Sign out */}
                  <div className="border-t pt-4">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="w-full justify-start text-destructive hover:text-destructive"
                    >
                      {isSigningOut ? (
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      ) : (
                        <LogOut className="h-5 w-5 mr-3" />
                      )}
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo / Brand */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <motion.div
                className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"
                whileHover={{ rotate: 5 }}
              >
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </motion.div>
              <span className="text-lg font-bold text-foreground hidden sm:block">
                Resume Analyzer
              </span>
            </Link>
          </div>

          {/* Quick action on the right: Theme toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}