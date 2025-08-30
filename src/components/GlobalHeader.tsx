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
  Settings
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
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <motion.div 
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"
              whileHover={{ rotate: 5 }}
            >
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </motion.div>
            <span className="text-xl font-bold text-foreground hidden sm:block">
              Resume Analyzer
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <motion.div key={item.path} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={isActivePath(item.path) ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className={`font-medium ${
                    isActivePath(item.path) 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Link to={item.path} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              </motion.div>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            
            <div className="flex items-center gap-2 ml-2 pl-2 border-l">
              <div className="text-sm">
                <p className="font-medium text-foreground">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-muted-foreground hover:text-destructive"
              >
                {isSigningOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 pb-6 border-b">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{user?.name || "User"}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  
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
                  </nav>
                  
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
          </div>
        </div>
      </div>
    </motion.header>
  );
}
