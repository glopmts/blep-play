const colors = require("./src/utils/colors").default;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  // @ts-ignore
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        colors,
      },
    },
  },
  plugins: [],
};
