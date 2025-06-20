// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss"],
  app: {
    head: {
      title: "Ziip | Connect the dots",
      meta: [
        {
          name: "description",
          content: "Ziip: Open-source clone of LinkedIn's Zip Game",
        },
      ],
    },
  },
});
