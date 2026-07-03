/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        duo: {
          green: "#58CC02",
          greenHover: "#61D800",
          greenShadow: "#58A700",
          greenLight: "#D7FFB8",
          blue: "#1CB0F6",
          blueShadow: "#1899D6",
          blueLight: "#DDF4FF",
          red: "#FF4B4B",
          redShadow: "#EA2B2B",
          redLight: "#FFDFE0",
          gold: "#FFC800",
          goldShadow: "#E6A800",
          purple: "#CE82FF",
          purpleShadow: "#A560E8",
          text: "#4B4B4B",
          gray: "#AFAFAF",
          border: "#E5E5E5",
          bg: "#F7F7F7"
        }
      },
      fontFamily: {
        duo: ["Nunito", "Heebo", "sans-serif"]
      },
      boxShadow: {
        card: "0 2px 0 0 #E5E5E5"
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
