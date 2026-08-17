import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: {
          base: "#F8FAFC",      // Clean architectural porcelain off-white
          subtle: "#F1F5F9",    // Soft slate tint
          elevated: "#FFFFFF",  // Pure white card surfaces
        },
        border: {
          subtle: "#E2E8F0",    // Crisp hairline separator
          active: "#CBD5E1",    // Selected / hover state
          strong: "#94A3B8",    // Focused input border
        },
        ink: {
          primary: "#0F172A",   // Deep charcoal / high-contrast readability
          secondary: "#475569", // Neutral muted slate
          tertiary: "#64748B",  // Subdued metadata
          faded: "#94A3B8",     // Unit labels & timestamps
        },
        // Restrained Scientific Thermal Scale (Muted & Accessible)
        thermal: {
          cool: "#0284C7",
          temperate: "#0D9488",
          moderate: "#D97706",
          high: "#EA580C",
          severe: "#DC2626",
          extreme: "#991B1B",
        },
        accent: {
          DEFAULT: "#0F172A",   // Editorial ink black
          subtle: "#F8FAFC",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "SF Mono", "monospace"],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'panel': '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
