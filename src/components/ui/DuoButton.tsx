import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "green" | "blue" | "white" | "red" | "gold" | "purple";

const variantClasses: Record<Variant, string> = {
  green:
    "bg-[linear-gradient(180deg,#6DE51A,#58CC02)] text-white border-duo-greenShadow shadow-[0_18px_34px_-18px_rgba(88,204,2,0.78)] hover:bg-duo-greenHover hover:-translate-y-0.5",
  blue: "bg-[linear-gradient(180deg,#9B7CFF,#8B5CF6)] text-white border-duo-purpleShadow shadow-[0_18px_34px_-18px_rgba(139,92,246,0.72)] hover:brightness-105 hover:-translate-y-0.5",
  red: "bg-duo-red text-white border-duo-redShadow hover:brightness-105",
  gold: "bg-duo-gold text-white border-duo-goldShadow hover:brightness-105",
  purple:
    "bg-[linear-gradient(180deg,#9B7CFF,#8B5CF6)] text-white border-duo-purpleShadow shadow-[0_18px_34px_-18px_rgba(139,92,246,0.72)] hover:brightness-105 hover:-translate-y-0.5",
  white:
    "bg-white/90 text-duo-purple border-duo-border border-2 border-b-4 shadow-sm hover:bg-duo-surface2",
};

interface DuoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "lg" | "xl";
  children: ReactNode;
}

/**
 * The signature Duolingo 3D chunky button: solid color, 4px darker bottom
 * border, and on press it sinks down (translate-y + border-b flattens).
 */
export default function DuoButton({
  variant = "green",
  size = "md",
  className = "",
  children,
  disabled,
  ...rest
}: DuoButtonProps) {
  const sizes = {
    md: "px-5 py-3 text-base",
    lg: "px-8 py-3.5 text-lg",
    xl: "px-10 py-4 text-xl",
  } as const;

  return (
    <button
      disabled={disabled}
      className={[
        "relative select-none overflow-hidden rounded-2xl font-extrabold tracking-wide transition-all duration-150",
        variant === "white" ? "" : "border-b-4",
        sizes[size],
        variantClasses[variant],
        disabled
          ? "cursor-not-allowed opacity-40 saturate-50"
          : "active:translate-y-[4px] active:border-b-0 active:mb-[4px] cursor-pointer",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
