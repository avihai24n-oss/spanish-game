/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        duo: {
          green: "#58CC02",
          greenHover: "#63D914",
          greenShadow: "#47A700",
          greenLight: "#E5FFD5",
          purple: "#8B5CF6",
          purpleHover: "#9667FF",
          purpleShadow: "#6D3EDB",
          purpleLight: "#EEE7FF",
          blue: "#6D5DF6",
          blueShadow: "#5747D7",
          blueLight: "#EEEAFD",
          red: "#FF4B4B",
          redShadow: "#D93737",
          redLight: "#FFE8E8",
          gold: "#FFC800",
          goldShadow: "#DDA900",
          text: "#273238",
          gray: "#697580",
          faint: "#9AA5AF",
          border: "#DCE4D5",
          borderStrong: "#C8D4C0",
          bg: "#F4F6F0",
          surface: "#FFFDF8",
          surface2: "#F9FAF5",
          ink: "#172024"
        }
      },
      fontFamily: {
        duo: ["Nunito", "Heebo", "sans-serif"]
      },
      boxShadow: {
        card: "0 2px 0 0 #DCE4D5",
        soft: "0 22px 60px -28px rgba(23, 32, 36, 0.28)",
        panel: "0 28px 80px -34px rgba(88, 204, 2, 0.35)"
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-8px)" },
          "40%": { transform: "translateX(8px)" },
          "60%": { transform: "translateX(-6px)" },
          "80%": { transform: "translateX(6px)" }
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" }
        },
        shine: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" }
        }
      },
      animation: {
        shake: "shake 0.45s ease-in-out",
        pop: "pop 0.35s ease-out",
        shine: "shine 2.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
