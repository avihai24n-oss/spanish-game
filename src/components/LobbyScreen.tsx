import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../game/store";
import DuoButton from "./ui/DuoButton";

function roomLink(roomId: string): string {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  baseUrl.searchParams.set("room", roomId);
  return baseUrl.toString();
}

/** Live multiplayer lobby: share the room link, watch the opponent join. */
export default function LobbyScreen() {
  const goHome = useGameStore((s) => s.goHome);
  const roomId = useGameStore((s) => s.roomId);
  const lobbyStatus = useGameStore((s) => s.lobbyStatus);
  const opponent = useGameStore((s) => s.opponent);
  const player = useGameStore((s) => s.player);
  const retryLobby = useGameStore((s) => s.retryLobby);
  const [copied, setCopied] = useState(false);

  const link = roomId ? roomLink(roomId) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  const waLink = `https://wa.me/?text=${encodeURIComponent(
    `⚔️ בוא נתחרה בספרדית! מי מהיר יותר?\n${link}`
  )}`;

  const creatingOrJoining = lobbyStatus === "creating" || lobbyStatus === "joining";
  const starting = lobbyStatus === "ready" || lobbyStatus === "starting";

  return (
    <main className="screen-shell flex items-center justify-center">
      <div className="panel w-full max-w-md overflow-hidden rounded-[2rem] p-7 text-center">
        <span className="eyebrow">דוקרב חי</span>
        <div className="mt-5 text-6xl">⚔️</div>
        <h2 className="mt-3 text-3xl font-black text-duo-ink">תחרות עם חבר</h2>

        <AnimatePresence mode="popLayout">
          {creatingOrJoining && (
            <motion.div
              key="spin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 flex flex-col items-center gap-4"
            >
              <motion.div
                className="h-10 w-10 rounded-full border-4 border-duo-border border-t-duo-purple"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-lg font-bold text-duo-gray">
                {lobbyStatus === "creating" ? "יוצרים חדר..." : "מצטרפים לחדר..."}
              </p>
            </motion.div>
          )}

          {lobbyStatus === "waiting" && roomId && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="mt-4 font-bold text-duo-gray">
                שלחו את הקישור — ברגע שהחבר נכנס, המרוץ מתחיל:
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

              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-[#128C7E] bg-[#25D366] px-4 py-3 text-base font-black text-white transition-all active:translate-y-[2px] active:border-b-0"
              >
                שליחה בוואטסאפ 💬
              </a>

              <div className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-duo-gray">
                <motion.span
                  className="inline-block h-2.5 w-2.5 rounded-full bg-duo-gold"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                מחכים שחבר יצטרף...
              </div>
            </motion.div>
          )}

          {starting && (
            <motion.div
              key="starting"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="mt-6"
            >
              <div className="flex items-center justify-center gap-4">
                <LobbyPlayer avatar={player.avatar} name={player.name} />
                <motion.span
                  className="text-2xl font-black text-duo-red"
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  VS
                </motion.span>
                <LobbyPlayer avatar={opponent.avatar} name={opponent.name} />
              </div>
              <p className="mt-5 text-xl font-black text-duo-green">
                {opponent.name} בפנים! מתחילים... 🏁
              </p>
            </motion.div>
          )}

          {lobbyStatus === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6"
            >
              <div className="rounded-2xl border border-duo-red/30 bg-duo-redLight px-4 py-3 font-bold text-duo-red">
                לא הצלחנו להתחבר לשרת המשחק 😕
              </div>
              <div className="mt-4">
                <DuoButton
                  variant="blue"
                  size="lg"
                  className="w-full"
                  onClick={retryLobby}
                >
                  נסיון נוסף 🔄
                </DuoButton>
              </div>
            </motion.div>
          )}

          {lobbyStatus === "full" && (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 rounded-2xl border border-duo-red/30 bg-duo-redLight px-4 py-3 font-bold text-duo-red"
            >
              החדר הזה כבר מלא — בקשו מהחבר קישור חדש, או פתחו חדר משלכם.
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8">
          <DuoButton variant="white" size="lg" className="w-full" onClick={goHome}>
            ביטול וחזרה
          </DuoButton>
        </div>
      </div>
    </main>
  );
}

function LobbyPlayer({ avatar, name }: { avatar: string; name: string }) {
  return (
    <div className="flex w-28 flex-col items-center rounded-2xl border border-duo-border bg-white/80 px-3 py-3 shadow-card">
      <span className="text-4xl">{avatar}</span>
      <span className="mt-1 max-w-full truncate text-sm font-black text-duo-ink">
        {name}
      </span>
    </div>
  );
}
