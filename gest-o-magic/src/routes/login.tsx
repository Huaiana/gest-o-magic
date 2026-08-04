import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Box, LogIn, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login - EstoqueSync" },
      { name: "description", content: "Acesse o sistema de gestão de estoque EstoqueSync." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      if (username === "admin" && password === "admin") {
        localStorage.setItem("estoqueSync_user", "admin");
        navigate({ to: "/dashboard" });
      } else {
        setError("Usuário ou senha incorretos. Use admin/admin.");
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="bg-primary p-3 rounded-xl inline-flex items-center justify-center mb-4">
            <Box className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Acesse o EstoqueSync</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Entre com suas credenciais para gerenciar o estoque.
          </p>
        </div>

        {error && (
          <div className="bg-status-danger/10 text-status-danger text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10"
                placeholder="admin"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg font-semibold transition disabled:opacity-70"
          >
            {isLoading ? (
              "Entrando..."
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Dica: use <span className="font-medium text-foreground">admin</span> / <span className="font-medium text-foreground">admin</span></p>
        </div>
      </div>
    </div>
  );
}
