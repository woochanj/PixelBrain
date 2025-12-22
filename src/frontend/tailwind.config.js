/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'pixel-bg': '#121212',
                'pixel-yellow': '#f7d51d',
                'pixel-red': '#e02c2c',
                'pixel-dark': '#242424',
                'pixel-green': '#2ecc71',
                'pixel-blue': '#58a6ff',
            },
            fontFamily: {
                'pixel': ['"DungGeunMo"', 'sans-serif'],
            },
            textShadow: {
                'pixel': '4px 4px 0px #e02c2c, 8px 8px 0px #242424',
            }
        },
    },
    plugins: [],
}
