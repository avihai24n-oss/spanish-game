import type { WordEntry, SentenceEntry, DistractorMap } from "../game/types";
import wordsJson from "./words.json";
import sentencesJson from "./sentences.json";

/**
 * Single access point for the datasets. The placeholder JSON files here will
 * be replaced by a generated 481-word dataset with the exact same schema —
 * nothing else in the app should import the JSON files directly.
 */
export const words: WordEntry[] = wordsJson as WordEntry[];
export const sentences: SentenceEntry[] = sentencesJson as SentenceEntry[];

/**
 * Optional curated distractor map (id -> [ids]). Loaded lazily via
 * import.meta.glob so the app works whether or not the file exists.
 */
const distractorModules = import.meta.glob("./distractor-map.json", {
  eager: true,
});

function loadDistractorMap(): DistractorMap {
  for (const mod of Object.values(distractorModules)) {
    const data = (mod as { default?: unknown }).default;
    if (data && typeof data === "object") return data as DistractorMap;
  }
  return {};
}

export const distractorMap: DistractorMap = loadDistractorMap();

export const wordById: Map<string, WordEntry> = new Map(
  words.map((w) => [w.id, w])
);
