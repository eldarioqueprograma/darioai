// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel({
    runtime: 'nodejs20.x'
  }),
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    cacheDir: '.vite'
  },
  
});
