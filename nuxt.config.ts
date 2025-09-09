import { defineNuxtConfig } from 'nuxt/config';
import tailwindcss from "@tailwindcss/vite";
import path from 'path';

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  // Middleware se dodaje automatski iz 'middleware' direktorija

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost/api' 
    }
  },

  css: [
    '@fontsource/roboto/400.css',
    '@fontsource/roboto/500.css',
    '@fontsource/roboto/700.css',
    '~/assets/css/main.css',
  ],

  ssr: false,

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@axios': path.resolve(__dirname, './src/axios.js'),
      }
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost',
          changeOrigin: true,
          rewrite: (path) => path 
        }
      }
    }
  },

  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/test-utils',
    'vuetify-nuxt-module',
    '@pinia/nuxt' 
  ],

  vuetify: {
    moduleOptions: {},
    vuetifyOptions: {}
  }
})