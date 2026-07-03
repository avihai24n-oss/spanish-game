import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "./game/store";
import HomeScreen from "./components/HomeScreen";
import LobbyScreen from "./components/LobbyScreen";
import GameScreen from "./components/GameScreen";
import WaitingScreen from "./components/WaitingScreen";
import ResultsScreen from "./components/ResultsScreen";

export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="min-h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          className="min-h-full"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {screen === "home" && <HomeScreen />}
          {screen === "lobby" && <LobbyScreen />}
          {screen === "game" && <GameScreen />}
          {screen === "waiting" && <WaitingScreen />}
          {screen === "results" && <ResultsScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
