/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#f3f4f6",

          secondary: "#60a5fa",

          accent: "#1e40af",

          neutral: "#111827",

          "base-100": "black",

          info: "#0000ff",

          success: "#3b82f6",

          warning: "#60a5fa",

          error: "#e0f2fe",
        },
      },
    ],
  },
  plugins: [daisyui],
};
