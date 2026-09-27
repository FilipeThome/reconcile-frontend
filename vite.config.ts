import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ')

function productionCsp(): Plugin {
  return {
    name: 'production-csp',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (ctx.server) return html
        const meta = `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}" />`
        return html.replace('<head>', `<head>\n    ${meta}`)
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), productionCsp()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/types.ts', 'src/**/*.test.{ts,tsx}'],
      thresholds: {
        lines: 95,
        functions: 95,
        statements: 95,
        branches: 80,
      },
    },
  },
})
