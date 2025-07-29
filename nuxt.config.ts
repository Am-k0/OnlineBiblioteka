// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config';
import tailwindcss from "@tailwindcss/vite";
import path from 'path';

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      // Ovo je za PRODUCTION. Ako tvoj Laravel backend bude na 'http://mojdomen.com/api', onda neka ostane /api
      // Ako Laravel backend bude na 'http://mojdomen.com' a rute su '/api/create', onda ovde stavi 'http://mojdomen.com'
      apiBase: process.env.API_BASE_URL || 'http://localhost/api' // Ostavite /api ovde ako vaše Laravel rute počinju sa /api
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
          target: 'http://localhost', // ISPRAVKA: Target je samo bazni URL backend servera (bez /api)
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, '/api') // Ovo je sada redundantno ako Laravel rute već imaju /api
          // Ako tvoje Laravel rute zaista počinju sa `/api` (kao što `Route::prefix('api')` implicira),
          // onda proxy već preusmerava `localhost:3000/api/create` na `localhost/api/create`.
          // Ne treba ti `rewrite` ako je `target` bazni domen, a rute već imaju prefiks.
          // Ali ako želiš da bude eksplicitno, možeš i ovo:
          rewrite: (path) => path // Bez izmene, prosleđuje putanju kakva jeste
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
  ],

  vuetify: {
    moduleOptions: {},
    vuetifyOptions: {}
  }
})