import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../lib/auth";

const IDLE_MS = 2 * 60 * 1000; // 2 minutos
const WARN_MS = 20 * 1000; // aviso nos últimos 20s

/**
 * Segurança: após 2 minutos sem uso, encerra a sessão
 * e volta para a tela principal (bloqueio).
 */
export function IdleTimeout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState<number | null>(null);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    if (!user) return;

    const reset = () => {
      lastActivity.current = Date.now();
      setRemaining(null);
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
      "visibilitychange",
    ];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    const interval = window.setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= IDLE_MS) {
        signOut();
        navigate({ to: "/" });
        return;
      }
      const left = IDLE_MS - idle;
      setRemaining(left <= WARN_MS ? Math.ceil(left / 1000) : null);
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      window.clearInterval(interval);
    };
  }, [user, signOut, navigate]);

  if (!user || remaining === null) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground shadow-xl no-print">
      Sessão será encerrada por inatividade em{" "}
      <span className="font-semibold">{remaining}s</span>
    </div>
  );
}
