/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./lib/test/setup.ts'],
    include: [
      '**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      '.next',
      '.vercel',
      'coverage',
      'dist'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}'
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/__tests__/**',
        '**/test/**',
        'app/layout.tsx',
        'app/globals.css'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})