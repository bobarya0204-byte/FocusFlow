import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/'

  return {
    plugins: [react()],
    // Supports Azure Static Web Apps and future subpath hosting
    base: base.endsWith('/') || base === './' ? base : `${base}/`,
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      // Keep Teams SDK as a normal dependency; do not externalize
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/@microsoft/teams-js')) {
              return 'teams-js'
            }
            return undefined
          },
        },
      },
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
  }
})
