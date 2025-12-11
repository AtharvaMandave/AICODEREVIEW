/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'bg-primary': '#0a0a0f',
                'bg-secondary': '#13131a',
                'bg-tertiary': '#1a1a24',
            },
        },
    },
    plugins: [],
}
