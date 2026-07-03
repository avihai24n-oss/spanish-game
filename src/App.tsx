import { useEffect } from "react";
import { useGameStore } from "./game/store";
import HomeScreen from "./components/HomeScreen";
import LobbyScreen from "./components/LobbyScreen";
import GameScreen from "./components/GameScreen";
import WaitingScreen from "./components/WaitingScreen";
import ResultsScreen from "./components/ResultsScreen";

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const showDemoScreen = useGameStore((s) => s.showDemoScreen);

  useEffect(() => {
    const demo = new URLSearchParams(window.location.search).get("demo");
    if (demo === "waiting" || demo === "results") {
      showDemoScreen(demo);
    }
  }, [showDemoScreen]);

  return (
    <div className="min-h-full">
      {screen === "home" && <HomeScreen />}
      {screen === "lobby" && <LobbyScreen />}
      {screen === "game" && <GameScreen />}
      {screen === "waiting" && <WaitingScreen />}
      {screen === "results" && <ResultsScreen />}
    </div>
  );
}
