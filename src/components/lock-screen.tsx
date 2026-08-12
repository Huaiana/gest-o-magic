import { Lock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function LockScreen() {
  const navigate = useNavigate({ from: "/" });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-10">
      <button
        type="button"
        onClick={() => navigate({ to: "/login" })}
        aria-label="Acessar o sistema"
        className="group relative outline-none"
      >
        <span className="absolute inset-0 rounded-[2rem] bg-primary/40 blur-3xl animate-logo-glow" />
        <img
          src="/logoESync.jpeg"
          alt="EstoqueSync"
          className="relative w-56 sm:w-72 rounded-[2rem] shadow-2xl animate-spin transition-transform duration-300 group-hover:scale-105"
        />
      </button>
      <p className="mt-8 text-sm text-muted-foreground flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5" />
        Clique no logo para acessar o sistema
      </p>
    </div>
  );
}
