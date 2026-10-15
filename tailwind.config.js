import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
                mono: ['"IBM Plex Mono"', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                brand: {
                    white: '#FFFFFF',
                    sky: '#EAF6FF',
                    skySoft: '#D6ECFB',
                    accent: '#168BC5',
                    accentDark: '#0F6C9E',
                    dark: '#102B4E',
                    text: '#2B3F5C',
                    muted: '#4B5F7A',
                    border: '#D3E6F4',
                },
                bmkg: {
                    50: '#EAF6FF',
                    100: '#D6ECFB',
                    500: '#168BC5',
                    600: '#0F6C9E',
                    700: '#075985',
                    800: '#102B4E',
                    900: '#0A1830',
                }
            }
        },
    },

    plugins: [forms],
};
