import { useEffect } from "react";

interface AuthRedirectProps {
  to: string;
}

export function AuthRedirect({ to }: AuthRedirectProps) {
  useEffect(() => {
    // Use replace to avoid leaving the current page in browser history
    window.location.replace(to);
  }, [to]);

  return null;
}