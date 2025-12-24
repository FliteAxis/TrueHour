/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // TrueHour dark theme colors matching existing design
        "truehour-dark": "#0f172a",
        "truehour-darker": "#0a0f1e",
        "truehour-card": "#1e293b",
        "truehour-border": "#334155",
        "truehour-blue": "#3b82f6",
        "truehour-green": "#10b981",
        "truehour-orange": "#f59e0b",
        "truehour-red": "#ef4444",
      },
    },
  },
  plugins: [],
};
