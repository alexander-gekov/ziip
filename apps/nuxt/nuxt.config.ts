import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  modules: ["@pinia/nuxt", "shadcn-nuxt"],
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
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: "./components/ui",
  },
  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss() as any],
  },
});
