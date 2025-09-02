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
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router";
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

function RootLayout() {
  return (
    <>
      <RouteSyncer />
      <GlobalHeader />
      <CommandPalette />
      <Outlet />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <InstrumentationProvider>
      <ConvexAuthProvider client={convex}>
        <ThemeProvider>
          <RouterProvider
            router={createBrowserRouter([
              {
                path: "/",
                element: <RootLayout />,
                children: [
                  { index: true, element: <Landing /> },
                  { path: "auth", element: <AuthPage redirectAfterAuth="/dashboard" /> },
                  { path: "dashboard", element: <Dashboard /> },
                  { path: "analytics", element: <Analytics /> },
                  { path: "dream-job", element: <DreamJob /> },
                  { path: "interview", element: <Interview /> },
                  { path: "profile", element: <Profile /> },
                  { path: "job-tracker", element: <JobTracker /> },
                  { path: "resume-builder", element: <ResumeBuilder /> },
                  { path: "*", element: <NotFound /> },
                ],
              },
            ])}
          />
          <Toaster />
        </ThemeProvider>
      </ConvexAuthProvider>
    </InstrumentationProvider>
  </StrictMode>,
);