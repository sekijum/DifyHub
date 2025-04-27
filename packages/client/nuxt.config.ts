import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
export default defineNuxtConfig({
  ssr: false,

  build: {
    transpile: ['vuetify'],
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
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