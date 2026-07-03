import { useEffect } from "react";
import { useGameStore } from "./game/store";
import HomeScreen from "./components/HomeScreen";
import ProfileScreen from "./components/ProfileScreen";
import LobbyScreen from "./components/LobbyScreen";
import GameScreen from "./components/GameScreen";
import WaitingScreen from "./components/WaitingScreen";
import ResultsScreen from "./components/ResultsScreen";

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const showDemoScreen = useGameStore((s) => s.showDemoScreen);
  const boot = useGameStore((s) => s.boot);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo");
    if (demo === "waiting" || demo === "results") {
      showDemoScreen(demo);
      return;
    }
    boot(params.get("room"));
  }, [showDemoScreen, boot]);

  useEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    const frame = requestAnimationFrame(resetScroll);
    return () => cancelAnimationFrame(frame);
  }, [screen]);

  return (
    <div className="min-h-full">
      {screen === "profile" && <ProfileScreen />}
      {screen === "home" && <HomeScreen />}
      {screen === "lobby" && <LobbyScreen />}
      {screen === "game" && <GameScreen />}
      {screen === "waiting" && <WaitingScreen />}
      {screen === "results" && <ResultsScreen />}
    </div>
  );
}
