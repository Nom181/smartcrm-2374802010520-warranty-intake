import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Giao diện gọi "/api/..." trên cùng địa chỉ; Vite chuyển tiếp sang máy chủ API.
// Đổi địa chỉ API bằng biến VITE_API_PROXY nếu API không chạy ở cổng 3000.
const target = process.env.VITE_API_PROXY || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': target } },
  preview: { port: 5173, proxy: { '/api': target } },
});
