import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,

  build: {
    transpile: ['vuetify'],
  },

  runtimeConfig: {
    public: {
      appEnv: process.env.NUXT_PUBLIC_APP_ENV,
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
      payjpPublicKey: process.env.NUXT_PUBLIC_PAYJP_PUBLIC_KEY,
      debug: process.env.NUXT_PUBLIC_APP_ENV !== 'production',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseBucketName: process.env.NUXT_PUBLIC_SUPABASE_BUCKET_NAME,
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
