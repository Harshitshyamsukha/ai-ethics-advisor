/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "surface": "#fff9ee",
                "background": "#fff9ee",
                "surface-bright": "#fff9ee",
                "primary-fixed-dim": "#c1c1ff",
                "on-primary-container": "#faf7ff",
                "on-error-container": "#93000a",
                "on-surface": "#1f1c0f",
                "on-background": "#1f1c0f",
                "surface-container-low": "#f6eed9",
                "surface-container-lowest": "#ffffff",
                "surface-container-high": "#ebe3ce",
                "surface-container-highest": "#e5ddc9",
                "outline-variant": "#c9c5d0",
                "primary": "#4343d5",
                "on-surface-variant": "#48464c",
                "error": "#ff5449",
                "error-container": "#ffdad6"
            },
            fontFamily: {
                headline: ['Manrope', 'sans-serif'],
                body: ['Manrope', 'sans-serif'],
            }
        },
    },
    plugins: [],
}