import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "green" | "blue" | "white" | "red" | "gold" | "purple";

const variantClasses: Record<Variant, string> = {
  green:
    "bg-duo-green text-white border-duo-greenShadow hover:bg-duo-greenHover",
  blue: "bg-duo-blue text-white border-duo-blueShadow hover:brightness-105",
  red: "bg-duo-red text-white border-duo-redShadow hover:brightness-105",
  gold: "bg-duo-gold text-white border-duo-goldShadow hover:brightness-105",
  purple:
    "bg-duo-purple text-white border-duo-purpleShadow hover:brightness-105",
  white:
    "bg-white text-duo-blue border-duo-border border-2 border-b-4 hover:bg-duo-bg",
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
        "select-none rounded-2xl font-extrabold tracking-wide transition-all duration-100",
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
