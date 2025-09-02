import { defineConfig, type UserConfig } from "vite";

export const createViteConfig = (config: UserConfig = {}): UserConfig => {
  return defineConfig({
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
        },
      },
    },
    ...config,
  });
};
