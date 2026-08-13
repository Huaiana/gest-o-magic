import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  Navigate,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "../lib/auth";
import { LockScreen } from "../components/lock-screen";
import { IdleTimeout } from "../components/idle-timeout";
import { Box, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Você pode tentar recarregar ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EstoqueSync - Gestão de Estoque Inteligente" },
      { name: "description", content: "Controle produtos, acompanhe movimentações e gere relatórios em uma plataforma simples, rápida e eficiente." },
      { name: "author", content: "EstoqueSync" },
      { property: "og:title", content: "EstoqueSync - Gestão de Estoque Inteligente" },
      { property: "og:description", content: "Controle produtos, acompanhe movimentações e gere relatórios em uma plataforma simples, rápida e eficiente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@EstoqueSync" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AuthGate() {
  const { ready, user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!ready) {
    return <div className="min-h-screen bg-background" />;
  }

  // Allow the public login route to render without authentication
  if (pathname === "/login") {
    if (user) {
      return <Navigate to="/dashboard" />;
    }
    return <Outlet />;
  }

  if (!user) {
    return <LockScreen />;
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <div className="bg-primary p-2 rounded-lg">
            <Box className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-lg tracking-wide text-foreground">EstoqueSync</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-1">
          <NavLink to="/dashboard" active={pathname === "/dashboard"}>Dashboard</NavLink>
          <NavLink to="/produtos" active={pathname.startsWith("/produtos")}>Produtos</NavLink>
          <NavLink to="/movimentacoes" active={pathname.startsWith("/movimentacoes")}>Movimentações</NavLink>
          <NavLink to="/relatorios" active={pathname === "/relatorios"}>Relatórios</NavLink>
        </nav>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={signOut}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-md flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
          <button
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-card border-t border-border px-4 pb-4">
          <Link
            to="/dashboard"
            className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            to="/produtos"
            className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Produtos
          </Link>
          <Link
            to="/movimentacoes"
            className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Movimentações
          </Link>
          <Link
            to="/relatorios"
            className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Relatórios
          </Link>
        </div>
      )}
    </header>
  );
}

function NavLink({
  to,
  children,
  active,
}: {
  to: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
        active
          ? "text-foreground bg-secondary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="bg-card border-t border-border py-6 text-center text-xs text-muted-foreground no-print mt-auto">
      <p>EstoqueSync v1.0 &copy; 2026 | Licença MIT</p>
    </footer>
  );
}
