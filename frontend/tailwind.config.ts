import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        farm: {
          green: "#2d6a4f",
          light: "#52b788",
          pale: "#d8f3dc",
          earth: "#8d6748",
          sun: "#f4a261",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
