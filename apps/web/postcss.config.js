module.exports = {
  plugins: {
    // Needed so the app can @import the shared brand tokens from outside its root.
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
