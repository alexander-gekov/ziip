import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  modules: [
    "@pinia/nuxt",
    "shadcn-nuxt",
    "@vueuse/nuxt",
    "nuxt-lucide-icons",
    "@nuxtjs/color-mode",
  ],
  colorMode: {
    preference: "system",
    fallback: "light",
    classSuffix: "",
    storageKey: "color-mode",
  },
  app: {
    head: {
      title: "Ziip | Connect the dots",
      meta: [
        {
          name: "description",
          content: "Ziip: Open-source clone of LinkedIn's Zip Game",
        },
      ],
      script: [
        {
          src: "https://umami-kck0c4csg4gsgo88gwgow8s8.alexandergekov.com/script.js",
          defer: true,
          "data-website-id": "37c004c9-de2d-4c36-842d-195e52f05e15",
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
  imports: {
    autoImport: true,
    dirs: ["components", "composables", "utils"],
  },
  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss() as any],
  },
});
