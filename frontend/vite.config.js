import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    // تحسين التخزين المؤقت طويل الأمد عبر فصل مكتبات الطرف الثالث
    // إلى chunks مستقلة (لا تتغير إلا عند تغيّر الإصدار).
    rollupOptions: {
      output: {
        // Vite 8 (Rolldown) يتطلب manualChunks كدالة
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-icons')) return 'icons'
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/') ||
              id.includes('/react-router')
            ) return 'react-vendor'
          }
        },
      },
    },
    // رفع حد التنبيه فقط (لا يؤثر على الحجم الفعلي)
    chunkSizeWarningLimit: 600,
  },
})
