import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  define: {
    __DEV__: true,
  },
  plugins: [
    {
      name: "mock-assets",
      transform(_code, id) {
        if (/\.(jpg|jpeg|png|gif|webp|svg|wav|mp3)(\?.*)?$/i.test(id)) {
          return {
            code: "const asset = { uri: 'mock-asset.png' }; export default asset; if (typeof module !== 'undefined') module.exports = asset;",
            map: null,
          };
        }
      },
    },
  ],
  resolve: {
    alias: {
      "react-native": "react-native-web",
      "@": path.resolve(__dirname, "./"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
