import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../game/store";
import DuoButton from "./ui/DuoButton";

function roomLink(roomId: string): string {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  baseUrl.searchParams.set("room", roomId);
  return baseUrl.toString();
}

/**
 * Multiplayer lobby shell. The generated link now points at the deployed app;
 * the realtime backend still needs to be connected behind MatchTransport.
 */
export default function LobbyScreen() {
  const goHome = useGameStore((s) => s.goHome);
  const [creating, setCreating] = useState(true);
  const [copied, setCopied] = useState(false);

  const roomId = useMemo(
    () => Math.random().toString(36).slice(2, 8).toUpperCase(),
    []
  );
  const link = useMemo(() => roomLink(roomId), [roomId]);

  useEffect(() => {
    const t = setTimeout(() => setCreating(false), 1600);
    return () => clearTimeout(t);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <main className="screen-shell flex items-center justify-center">
      <div className="panel w-full max-w-md overflow-hidden rounded-[2rem] p-7 text-center">
        <span className="eyebrow">multiplayer</span>
        <div className="mt-5 text-6xl">⚔️</div>
        <h2 className="mt-3 text-3xl font-black text-duo-ink">תחרות עם חבר</h2>

        {creating ? (
          <div className="mt-6 flex flex-col items-center gap-4">
            <motion.div
              className="h-10 w-10 rounded-full border-4 border-duo-border border-t-duo-purple"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-lg font-bold text-duo-gray">יוצרים חדר...</p>
          </div>
        ) : (
          <>
            <p className="mt-4 font-bold text-duo-gray">
              שלחו את הקישור לחבר כדי להתחרות באותן שאלות בדיוק:
            </p>
            <div
              className="mt-4 flex items-center gap-2 rounded-2xl border border-duo-border bg-white/70 px-3 py-2.5 shadow-inner"
              dir="ltr"
            >
              <span className="es-text flex-1 truncate text-sm font-bold text-duo-purple">
                {link}
              </span>
              <button
                onClick={copy}
                className="shrink-0 rounded-xl border-b-2 border-duo-purpleShadow bg-duo-purple px-3 py-1.5 text-sm font-extrabold text-white transition-all active:translate-y-[2px] active:border-b-0"
              >
                {copied ? "הועתק ✓" : "העתקה"}
              </button>
            </div>
            <div className="mt-3 rounded-xl border border-duo-purple/20 bg-duo-purpleLight px-3 py-2 text-sm font-bold text-duo-purpleShadow">
              🚧 הקישור מוכן ל־Pages. דוקרב חי דורש backend realtime.
            </div>
          </>
        )}

        <div className="mt-8">
          <DuoButton variant="white" size="lg" className="w-full" onClick={goHome}>
            חזרה
          </DuoButton>
        </div>
      </div>
    </main>
  );
}
