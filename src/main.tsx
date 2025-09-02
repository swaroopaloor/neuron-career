import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import AuthPage from "@/pages/Auth.tsx";
import Dashboard from "@/pages/Dashboard.tsx";
import Profile from "@/pages/Profile.tsx";
import { ThemeProvider } from "@/components/ThemeProvider.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";
import "./types/global.d.ts";
import JobTracker from "./pages/JobTracker.tsx";
import ResumeBuilder from "@/pages/ResumeBuilder.tsx";
import { GlobalHeader } from "@/components/GlobalHeader";
import { CommandPalette } from "@/components/CommandPalette";
import Analytics from "@/pages/Analytics.tsx";
import DreamJob from "@/pages/DreamJob.tsx";
import Interview from "@/pages/Interview.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <InstrumentationProvider>
      <ConvexAuthProvider client={convex}>
        <ThemeProvider>
          <BrowserRouter>
            <RouteSyncer />
            <GlobalHeader />
            <CommandPalette />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/dream-job" element={<DreamJob />} />
              <Route path="/interview" element={<Interview />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/job-tracker" element={<JobTracker />} />
              <Route path="/resume-builder" element={<ResumeBuilder />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </ThemeProvider>
      </ConvexAuthProvider>
    </InstrumentationProvider>
  </StrictMode>,
);