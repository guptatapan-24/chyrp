module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
};
