// @ts-check
import { defineConfig } from 'astro/config';
import qwikdev from '@qwikdev/astro';
import { qwikReact } from '@builder.io/qwik-react/vite';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [qwikdev()],
  vite: {
    plugins: [tailwindcss(), qwikReact()],
  },
});
