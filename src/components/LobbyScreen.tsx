import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../game/store";
import DuoButton from "./ui/DuoButton";

/**
 * Multiplayer lobby stub. Shows the "creating room" flow with a fake
 * shareable link (clearly marked as demo). Will be backed by
 * RealtimeTransport once the realtime backend is wired up.
 */
export default function LobbyScreen() {
  const goHome = useGameStore((s) => s.goHome);
  const [creating, setCreating] = useState(true);
  const [copied, setCopied] = useState(false);

  const roomId = useMemo(
    () => Math.random().toString(36).slice(2, 8).toUpperCase(),
    []
  );
  const link = `https://vamos.example/room/${roomId}`;

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
    <div className="dotted-bg flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border-2 border-duo-border bg-white p-8 text-center shadow-card">
        <div className="text-6xl">⚔️</div>
        <h2 className="mt-3 text-2xl font-black">תחרות עם חבר</h2>

        {creating ? (
          <div className="mt-6 flex flex-col items-center gap-4">
            <motion.div
              className="h-10 w-10 rounded-full border-4 border-duo-border border-t-duo-blue"
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
              className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-duo-border bg-duo-bg px-3 py-2.5"
              dir="ltr"
            >
              <span className="es-text flex-1 truncate text-sm font-bold text-duo-blue">
                {link}
              </span>
              <button
                onClick={copy}
                className="shrink-0 rounded-xl border-b-2 border-duo-blueShadow bg-duo-blue px-3 py-1.5 text-sm font-extrabold text-white transition-all active:translate-y-[2px] active:border-b-0"
              >
                {copied ? "הועתק ✓" : "העתקה"}
              </button>
            </div>
            <div className="mt-3 rounded-xl bg-duo-blueLight px-3 py-2 text-sm font-bold text-duo-blueShadow">
              🚧 דמו בלבד — משחק רשת אמיתי יחובר בקרוב
            </div>
          </>
        )}

        <div className="mt-8">
          <DuoButton variant="white" size="lg" className="w-full" onClick={goHome}>
            חזרה
          </DuoButton>
        </div>
      </div>
    </div>
  );
}
