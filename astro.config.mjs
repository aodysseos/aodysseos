import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://www.andreasodysseos.com',
  integrations: [react()],
  vite: {
    ssr: {
      noExternal: ['three'],
    },
  },
});
