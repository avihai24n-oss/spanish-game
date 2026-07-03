import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "../game/store";
import { AVATAR_CHOICES } from "../game/profile";
import DuoButton from "./ui/DuoButton";

/**
 * Username-only "login": pick a name + avatar, no password. Stats are saved
 * per name, and invite links continue straight into the room after this.
 */
export default function ProfileScreen() {
  const setProfile = useGameStore((s) => s.setProfile);
  const existing = useGameStore((s) => s.profile);
  const pendingRoomId = useGameStore((s) => s.pendingRoomId);

  const [name, setName] = useState(existing?.name ?? "");
  const [avatar, setAvatar] = useState(existing?.avatar ?? AVATAR_CHOICES[0]);

  const valid = name.trim().length >= 2;

  const submit = () => {
    if (valid) setProfile(name, avatar);
  };

  return (
    <main className="screen-shell flex items-center justify-center">
      <motion.section
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
        className="panel w-full max-w-md rounded-[2rem] p-7 text-center"
      >
        <span className="eyebrow">הפרופיל שלך</span>
        <motion.div
          key={avatar}
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 14 }}
          className="mt-5 text-7xl"
        >
          {avatar}
        </motion.div>

        <h1 className="mt-3 text-3xl font-black text-duo-ink">
          {pendingRoomId ? "עוד רגע נכנסים לדוקרב!" : "איך קוראים לך?"}
        </h1>
        <p className="mt-1 text-sm font-bold text-duo-gray">
          {pendingRoomId
            ? "רק שם — כדי שהיריב ידע את מי הוא מנצח 😉"
            : "בלי סיסמאות. השם שומר את הנקודות והנצחונות שלך."}
        </p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="השם שלך..."
          maxLength={16}
          autoFocus
          className="mt-6 w-full rounded-2xl border-2 border-b-4 border-duo-border bg-white px-4 py-3.5 text-center text-xl font-black text-duo-ink outline-none transition-colors placeholder:text-duo-gray/50 focus:border-duo-blue"
        />

        <div className="mt-5 grid grid-cols-4 gap-2">
          {AVATAR_CHOICES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              aria-label={`בחירת אווטר ${a}`}
              className={`rounded-2xl border-2 border-b-4 py-2.5 text-3xl transition-all ${
                avatar === a
                  ? "border-duo-blue bg-duo-blueLight"
                  : "border-duo-border bg-white hover:bg-duo-bg"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="mt-7">
          <DuoButton
            variant="green"
            size="xl"
            className="w-full"
            disabled={!valid}
            onClick={submit}
          >
            {pendingRoomId ? "יאללה, לדוקרב ⚔️" : "יאללה, מתחילים!"}
          </DuoButton>
        </div>
      </motion.section>
    </main>
  );
}
