import { useEffect } from "react";
import { useNavigate } from "react-router";

interface AuthRedirectProps {
  to: string;
}

export function AuthRedirect({ to }: AuthRedirectProps) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);

  return null;
}
