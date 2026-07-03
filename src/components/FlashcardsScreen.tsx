import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "../game/store";
import { words } from "../data";
import { ALL_LEVELS, LEVEL_LABELS, type Level, type WordEntry } from "../game/types";
import DuoButton from "./ui/DuoButton";
import { useSound } from "../hooks/useSound";

const LEVEL_ICONS: Record<Level, string> = {
  easy: "🌱",
  medium: "⭐",
  hard: "🔥",
  expert: "👑",
};

type FlashDirection = "es-front" | "he-front";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Word-flashcard practice: pick levels + direction, then flip through the
 * whole word pool card by card. Tap a card to flip it to its translation.
 */
export default function FlashcardsScreen() {
  const [deck, setDeck] = useState<WordEntry[] | null>(null);
  const [direction, setDirection] = useState<FlashDirection>("es-front");

  if (deck === null) {
    return (
      <FlashcardsSetup
        direction={direction}
        onDirection={setDirection}
        onStart={(cards) => setDeck(shuffle(cards))}
      />
    );
  }
  return (
    <FlashcardsDeck
      deck={deck}
      direction={direction}
      onReshuffle={() => setDeck(shuffle(deck))}
      onExitDeck={() => setDeck(null)}
    />
  );
}

function FlashcardsSetup({
  direction,
  onDirection,
  onStart,
}: {
  direction: FlashDirection;
  onDirection: (d: FlashDirection) => void;
  onStart: (cards: WordEntry[]) => void;
}) {
  const goHome = useGameStore((s) => s.goHome);
  const selectedLevels = useGameStore((s) => s.selectedLevels);
  const toggleLevel = useGameStore((s) => s.toggleLevel);
  const setLevels = useGameStore((s) => s.setLevels);
  const { play } = useSound();

  const cards = useMemo(
    () => words.filter((w) => selectedLevels.includes(w.level)),
    [selectedLevels]
  );
  const allSelected = selectedLevels.length === ALL_LEVELS.length;

  return (
    <main className="screen-shell flex items-center justify-center">
      <motion.section
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
        className="panel w-full max-w-md rounded-[2rem] p-7 text-center"
      >
        <span className="eyebrow">תרגול מילים</span>
        <div className="mt-4 text-6xl">🃏</div>
        <h1 className="mt-3 text-3xl font-black text-duo-ink">כרטיסיות</h1>
        <p className="mt-1 text-sm font-bold text-duo-gray">
          הקישו על כרטיס כדי להפוך אותו ולראות את התרגום. בלי שעון, בלי לחץ.
        </p>

        <div className="mt-6 text-start">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-duo-gray">
              רמת קושי
            </p>
            <button
              type="button"
              onClick={() => {
                play("click");
                setLevels([...ALL_LEVELS]);
              }}
              className={`rounded-full px-2.5 py-0.5 text-xs font-black transition-colors ${
                allSelected ? "bg-duo-purple text-white" : "bg-duo-border/60 text-duo-gray"
              }`}
            >
              הכל
            </button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {ALL_LEVELS.map((level) => {
              const active = selectedLevels.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    play("click");
                    toggleLevel(level);
                  }}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-2 text-xs font-black transition-all ${
                    active
                      ? "border-duo-green bg-duo-green/10 text-duo-greenShadow"
                      : "border-duo-border bg-white/60 text-duo-gray opacity-70"
                  }`}
                >
                  <span className="text-lg leading-none">{LEVEL_ICONS[level]}</span>
                  {LEVEL_LABELS[level]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 text-start">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-duo-gray">
            כיוון התרגול
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <DirectionOption
              active={direction === "es-front"}
              title="ספרדית ← עברית"
              subtitle="רואים ספרדית, נזכרים בעברית"
              onClick={() => {
                play("click");
                onDirection("es-front");
              }}
            />
            <DirectionOption
              active={direction === "he-front"}
              title="עברית ← ספרדית"
              subtitle="רואים עברית, נזכרים בספרדית"
              onClick={() => {
                play("click");
                onDirection("he-front");
              }}
            />
          </div>
        </div>

        <div className="mt-7 grid gap-2">
          <DuoButton
            variant="green"
            size="xl"
            className="w-full"
            onClick={() => {
              play("click");
              onStart(cards);
            }}
          >
            יאללה, מתחילים! ({cards.length} מילים)
          </DuoButton>
          <DuoButton variant="white" size="lg" className="w-full" onClick={goHome}>
            חזרה
          </DuoButton>
        </div>
      </motion.section>
    </main>
  );
}

function DirectionOption({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-2xl border-2 px-3 py-2.5 text-start transition-all ${
        active
          ? "border-duo-blue bg-duo-blueLight"
          : "border-duo-border bg-white/60 opacity-75"
      }`}
    >
      <span className="block text-sm font-black text-duo-ink">{title}</span>
      <span className="mt-0.5 block text-[11px] font-bold text-duo-gray">
        {subtitle}
      </span>
    </button>
  );
}

function FlashcardsDeck({
  deck,
  direction,
  onReshuffle,
  onExitDeck,
}: {
  deck: WordEntry[];
  direction: FlashDirection;
  onReshuffle: () => void;
  onExitDeck: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const { play } = useSound();

  const word = deck[index];
  const esFront = direction === "es-front";

  const go = (delta: number) => {
    play("click");
    setFlipped(false);
    setIndex((i) => (i + delta + deck.length) % deck.length);
  };

  return (
    <main className="screen-shell flex items-center justify-center">
      <div className="w-full max-w-md">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={onExitDeck}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-duo-border bg-white/80 text-lg font-black text-duo-gray shadow-card"
            aria-label="חזרה לבחירת רמה"
          >
            →
          </button>
          <div className="rounded-2xl border border-duo-border bg-white/80 px-4 py-1.5 text-sm font-black tabular-nums text-duo-ink shadow-sm">
            {index + 1} / {deck.length}
          </div>
          <button
            type="button"
            onClick={() => {
              play("click");
              setFlipped(false);
              setIndex(0);
              onReshuffle();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-duo-border bg-white/80 text-lg shadow-card"
            aria-label="ערבוב מחדש"
          >
            🔀
          </button>
        </header>

        <div className="mt-6" style={{ perspective: 1200 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.button
              key={word.id}
              type="button"
              onClick={() => {
                play("click");
                setFlipped((f) => !f);
              }}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1, rotateY: flipped ? 180 : 0 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              className="relative block h-72 w-full cursor-pointer"
              style={{ transformStyle: "preserve-3d" }}
              aria-label="הפיכת הכרטיס"
            >
              <CardFace
                lang={esFront ? "es" : "he"}
                word={word}
                hint="הקישו כדי לראות את התרגום"
              />
              <CardFace
                lang={esFront ? "he" : "es"}
                word={word}
                hint="הקישו כדי לחזור"
                back
              />
            </motion.button>
          </AnimatePresence>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <DuoButton variant="white" size="lg" onClick={() => go(-1)}>
            → הקודם
          </DuoButton>
          <DuoButton variant="blue" size="lg" onClick={() => go(1)}>
            הבא ←
          </DuoButton>
        </div>
      </div>
    </main>
  );
}

function CardFace({
  lang,
  word,
  hint,
  back = false,
}: {
  lang: "es" | "he";
  word: WordEntry;
  hint: string;
  back?: boolean;
}) {
  const text = lang === "es" ? word.es : word.he;
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] border border-duo-border p-6 shadow-soft ${
        back ? "bg-duo-blueLight" : "bg-white"
      }`}
      style={{
        backfaceVisibility: "hidden",
        transform: back ? "rotateY(180deg)" : undefined,
      }}
    >
      <span className="absolute right-4 top-4 rounded-full border border-duo-border bg-white/80 px-2.5 py-0.5 text-xs font-black text-duo-gray">
        {LEVEL_ICONS[word.level]} {LEVEL_LABELS[word.level]}
      </span>
      <span
        dir={lang === "es" ? "ltr" : "rtl"}
        className={`max-w-full break-words text-center text-4xl font-black leading-tight text-duo-ink ${
          lang === "es" ? "es-text" : ""
        }`}
      >
        {text}
      </span>
      {back && (
        <span className="es-text mt-2 text-sm font-bold text-duo-gray" dir="ltr">
          {word.en}
        </span>
      )}
      <span className="absolute bottom-4 text-[11px] font-bold text-duo-gray/80">
        {hint}
      </span>
    </div>
  );
}
