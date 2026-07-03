import { useCallback, useRef } from "react";

export type SoundName = "correct" | "wrong" | "click" | "win" | "combo";

/**
 * Tiny sound hook using plain Audio. Sound files live in /public/sounds/
 * (e.g. /sounds/correct.mp3). If a file is missing the hook silently no-ops,
 * so the game works with zero audio assets present.
 */
export function useSound() {
  const cache = useRef<Map<SoundName, HTMLAudioElement>>(new Map());

  const play = useCallback((name: SoundName) => {
    try {
      let audio = cache.current.get(name);
      if (!audio) {
        audio = new Audio(`/sounds/${name}.mp3`);
        audio.volume = 0.6;
        cache.current.set(name, audio);
      }
      audio.currentTime = 0;
      void audio.play().catch(() => {
        /* file missing or autoplay blocked — no-op */
      });
    } catch {
      /* no-op */
    }
  }, []);

  return { play };
}
