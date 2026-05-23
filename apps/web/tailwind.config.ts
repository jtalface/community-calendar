import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201a",
        leaf: "#2f7d59",
        peach: "#f08d6c",
        skywash: "#e9f5f4",
        lemon: "#f6d66f"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(25, 54, 44, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;
