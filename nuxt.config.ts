// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config';
import tailwindcss from "@tailwindcss/vite";
import path from 'path'; // Uvezite 'path' modul

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:80/api'
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
    resolve: { // DODAJTE OVAJ RESOLVE OBJEKAT
      alias: {
        // Postojeći ~ i @ alijasi su već automatski podešeni od strane Nuxt-a
        // Ali možete eksplicitno dodati ako želite specifičnu putanju za @/axios
        '@': path.resolve(__dirname, './'), // Ovo je već podrazumevano u Nuxtu da '@' pokazuje na root
                                            // Ako je vaš axios.js u 'src', onda bi bilo './src'
        '~': path.resolve(__dirname, './'), // Isto za '~'
        '@axios': path.resolve(__dirname, './src/axios.js'), // <-- DODAJTE OVAJ ALIAS ZA AXIOS
        // Ako je vaš axios.js direktno u root-u projekta:
        // '@axios': path.resolve(__dirname, './axios.js'),
        // Ako je vaš axios.js u 'plugins' folderu unutar 'src':
        // '@axios': path.resolve(__dirname, './src/plugins/axios.js'),
      }
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:80/api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api')
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