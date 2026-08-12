import { createFileRoute, Navigate } from "@tanstack/react-router";
import { LoginForm } from "../components/login-form";
import { useAuth } from "../lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <LoginForm />
    </div>
  );
}
