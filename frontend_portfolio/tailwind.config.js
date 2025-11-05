const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@material-tailwind/react/components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@material-tailwind/react/theme/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        flipXOnce: {
          '0%': { transform: 'rotateX(0deg)' },
          '60%': { transform: 'rotateX(720deg)' },  // 2 quick full flips
          '100%': { transform: 'rotateX(0deg)' },   // smoothly back to original
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'flipXOnce-hover': 'flipXOnce 2s ease-in-out forwards',
        'blink-fast': 'blink 0.3s linear infinite',
      },
    },
  },
  plugins: [],
});
