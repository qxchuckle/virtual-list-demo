import { fileURLToPath, URL } from "node:url";
import dts from "vite-plugin-dts";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // dts(),
  ],
  build: {
    outDir: "dist",
    target: "es2020",
    cssCodeSplit: false, // 禁止 CSS 代码分离
    lib: {
      // 入口文件
      entry: "src/components/index.ts",
      // 暴露的全局变量名
      name: "qxVirtualList",
      // 输出的包文件名，默认是package.json的name字段
      fileName: "qx-virtual-list",
    },
    rollupOptions: {
      // 排除依赖
      external: ["vue"],
      output: {
        //在UMD构建模式下为这些外部化的体赖提供一个全局变量
        globals: {
          vue: "Vue",
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
