import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api/proxy': {
        target: 'https://script.google.com/macros/s/AKfycbzGTU7gWu_FlR2NbWkuh4p2RL0XHnMa3szvQlZ2mO9LcbKITDuO8WF937rQ0lCKs_87/exec',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, '')
      }
    }
  }
});
