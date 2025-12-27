import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ここを追加！ '/リポジトリ名/' としてください。
  // 例: https://github.com/user/my-pangram-app なら '/my-pangram-app/'
  base: '/PangramEditor/',
});
