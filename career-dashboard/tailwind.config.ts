import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "hsl(var(--ink))",
        paper: "hsl(var(--paper))",
        surface: "hsl(var(--surface))",
        line: "hsl(var(--line))",
        muted: "hsl(var(--muted))",
        signal: "hsl(var(--signal))",
        good: "hsl(var(--good))",
        warn: "hsl(var(--warn))",
        risk: "hsl(var(--risk))",
        dsa: "hsl(var(--dsa))",
        pytorch: "hsl(var(--pytorch))",
        physics: "hsl(var(--physics))",
        career: "hsl(var(--career))",
      },
      fontFamily: {
        sans: ["var(--font-plex)", "ui-sans-serif", "system-ui"],
      },
      borderRadius: { DEFAULT: "5px", lg: "8px" },
      fontSize: {
        micro: ["0.75rem", { lineHeight: "1.05rem", letterSpacing: "0.005em" }],
      },
      keyframes: {
        "toast-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { "toast-in": "toast-in 160ms ease-out" },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
