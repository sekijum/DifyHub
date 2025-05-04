import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,

  build: {
    transpile: ['vuetify'],
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
      appEnv: process.env.APP_ENV,
    },
  },

  css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.css'],

  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', config => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
    //...
  ],

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },

  app: {
    head: {
      title: 'DifyHub',
    },
  },

  plugins: ['~/plugins/storage'],
  compatibilityDate: '2025-04-24',
});
