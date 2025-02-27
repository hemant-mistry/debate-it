/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui"
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  daisyui: {
    themes: [
      {
        mytheme: {

          "primary": "#0096da",

          "secondary": "#00d2f3",

          "accent": "#009c00",

          "neutral": "#060406",

          "base-100": "#eeffff",

          "info": "#009eff",

          "success": "#00d9ab",

          "warning": "#b53400",

          "error": "#c02446",
        },
      },
    ],
  },
  plugins: [daisyui],
}