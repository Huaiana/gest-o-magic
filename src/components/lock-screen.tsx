import { useState } from "react";
import { LogIn, Eye, EyeOff, Lock } from "lucide-react";
import { useAuth } from "../lib/auth";
import logoAsset from "../assets/logoESync.jpg.asset.json";

export function LockScreen() {
  const { signIn, changeCredentials } = useAuth();
  const [mode, setMode] = useState<"login" | "change">("login");
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // change credentials fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfo("");
    setTimeout(() => {
      if (!signIn(username, password)) {
        setError("Usuário ou senha incorretos.");
      }
      setIsLoading(false);
    }, 400);
  };

  const handleChange = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (newPassword.length < 4) {
      setError("A nova senha deve ter pelo menos 4 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("A confirmação da nova senha não confere.");
      return;
    }
    if (!changeCredentials(currentPassword, { username: newUsername, password: newPassword })) {
      setError("Senha atual incorreta.");
      return;
    }
    setInfo("Credenciais atualizadas. Acesso liberado.");
  };

  if (!showLogin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-10">
        <button
          type="button"
          onClick={() => setShowLogin(true)}
          aria-label="Acessar o sistema"
          className="group relative outline-none"
        >
          <span className="absolute inset-0 rounded-[2rem] bg-primary/40 blur-3xl animate-logo-glow" />
          <img
            src={logoAsset.url}
            alt="EstoqueSync"
            className="relative w-56 sm:w-72 rounded-[2rem] shadow-2xl animate-logo-float transition-transform duration-300 group-hover:scale-105"
          />
        </button>
        <p className="mt-8 text-sm text-muted-foreground flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          Clique no logo para acessar o sistema
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl animate-fade-in">
        <div className="text-center mb-8">
          <img
            src={logoAsset.url}
            alt="EstoqueSync"
            className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-lg animate-logo-float"
          />
          <h1 className="text-2xl font-bold text-foreground">EstoqueSync</h1>
          <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Sistema bloqueado. Faça login para continuar.
          </p>
        </div>


        {error && (
          <div className="bg-status-danger/10 text-status-danger text-sm p-3 rounded-lg mb-4">{error}</div>
        )}
        {info && (
          <div className="bg-primary/10 text-primary text-sm p-3 rounded-lg mb-4">{info}</div>
        )}

        {mode === "login" ? (
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Usuário</label>
              <input
                type="text"
                name="estoque-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-form-type="other"
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Digite seu usuário"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="estoque-pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10"
                  placeholder="Digite sua senha"
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
              {isLoading ? "Entrando..." : (<><LogIn className="w-4 h-4" />Entrar</>)}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Senha atual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Novo usuário</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Manter o atual se vazio"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nova senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg font-semibold transition"
            >
              Salvar novas credenciais
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "change" : "login");
            setError("");
            setInfo("");
          }}
          className="mt-5 w-full text-sm text-muted-foreground hover:text-foreground transition"
        >
          {mode === "login" ? "Alterar usuário e senha" : "Voltar para o login"}
        </button>
      </div>
    </div>
  );
}
