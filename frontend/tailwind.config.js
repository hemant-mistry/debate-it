/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  daisyui: {
    themes: [
      {
        mytheme: {
          /* page / surface */
          "base-100": "#ffffff",   // main page background (light)

          /* primary = main brand/button color */
          primary: "#2563EB",      // blue-600 (buttons, primary accents)

          /* secondary = softer accent (used for avatars / highlights) */
          secondary: "#06B6D4",    // cyan-500 / teal-ish

          /* accent = additional accent for chips, badges, etc. */
          accent: "#1E40AF",       // indigo-900 (strong contrast accent)

          /* neutral = main text / muted headings */
          neutral: "#374151",      // gray-700 (dark text on white)

          /* UI semantic colors */
          info: "#3B82F6",         // blue-500
          success: "#10B981",      // green-500
          warning: "#F59E0B",      // amber-500
          error: "#EF4444"         // red-500
        }
      }
    ]
  },
  plugins: [daisyui],
};
