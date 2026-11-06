import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        apple: {
          bg: "#F5F5F7",
          darkBg: "#000000",
          card: "rgba(255, 255, 255, 0.8)",
          cardDark: "rgba(28, 28, 30, 0.8)",
          border: "rgba(0, 0, 0, 0.08)",
          borderDark: "rgba(255, 255, 255, 0.12)",
          blue: "#0071E3",
          orange: "#FF9500",
          green: "#34C759",
          red: "#FF3B30",
          yellow: "#FFCC00",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        apple: "0 4px 24px -1px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        "apple-hover": "0 8px 32px -2px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)",
        "apple-glow": "0 0 20px rgba(0, 113, 227, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
