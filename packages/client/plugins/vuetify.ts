import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export default defineNuxtPlugin(nuxtApp => {
  const { getTheme } = useStorage();

  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: getTheme(),
      themes: {
        dark: {
          dark: true,
        },
        light: {
          dark: false,
        },
      },
    },
  });

  nuxtApp.vueApp.use(vuetify);
});
