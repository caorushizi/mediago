import {defineConfig} from "vite";
import {resolve} from "path";
import reactRefresh from "@vitejs/plugin-react-refresh";

export default defineConfig({
    root: __dirname,
    server: {
        port: 7789,
        strictPort: true,
    },
    resolve: {
        alias: [
            {find: /^types/, replacement: resolve(__dirname, "../src/types")},
            {find: /^~/, replacement: ""},
        ],
    },
    envDir: "../../",
    plugins: [reactRefresh()],
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
            },
        },
    },
})