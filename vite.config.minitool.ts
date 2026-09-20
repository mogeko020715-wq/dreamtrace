import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// 小红书小工具离线包专用构建配置：
// - 经典脚本（iife 单文件，无 type="module" / import / export）
// - ES2017 / Chrome 61 语法基线（js-compatibility.md）
// - 相对路径引用（zip-artifact-spec.md §4）
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist-minitool',
    target: ['es2017', 'chrome61'],
    cssTarget: ['chrome61'],
    modulePreload: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/app.js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
