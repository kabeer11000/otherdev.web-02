// @ts-check
import { defineConfig } from 'astro/config';
import qwikdev from '@qwikdev/astro';
import { qwikReact } from '@builder.io/qwik-react/vite';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [qwikdev()],
  vite: {
    plugins: [tailwindcss(), qwikReact()],
  },
});
