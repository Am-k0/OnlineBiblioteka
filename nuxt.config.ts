// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  
  // Runtime konfiguracija za Laravel API
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://127.0.0.1:8000/api'
    }
  },

  css: [
    '@fontsource/roboto/400.css',
    '@fontsource/roboto/500.css',
    '@fontsource/roboto/700.css',
    '~/assets/css/main.css',
  ],
  
  ssr: true,

  vite: {
    plugins: [tailwindcss()],
  },

  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/test-utils',
    'vuetify-nuxt-module',

  ],

  vuetify: {
    moduleOptions: {

    },
    vuetifyOptions: {
    
    }
  }
})