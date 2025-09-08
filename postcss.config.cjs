module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Only add purgecss in production to avoid issues
    ...(process.env.NODE_ENV === 'production' && {
      '@fullhuman/postcss-purgecss': {
        content: ['./index.html', './**/*.{js,ts,jsx,tsx}'],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
      }
    })
  }
};