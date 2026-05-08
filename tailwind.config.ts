import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F766E",
          dark: "#0B3D3A",
          light: "#5EEAD4",
        },
        surface: "#F0FDFA",
        accent: "#F59E0B",
        coral: "#F97066",
        border: "#E2E8F0",
        "text-mute": "#475569",
      },
      fontFamily: {
        serif: ["Georgia", "Source Serif Pro", "serif"],
        sans: ["system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
