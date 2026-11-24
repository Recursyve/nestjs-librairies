import path from "node:path";
import { fileURLToPath } from "node:url";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [swc.vite()],
    resolve: {
        alias: {
            "@recursyve/nestjs-data-filter": path.resolve(root, "../dist")
        }
    },
    test: {
        globals: true,
        pool: "forks",
        maxWorkers: 4,
        fileParallelism: true,
        globalSetup: ["./test/setup/global-setup.ts"],
        setupFiles: ["./test/setup/setup-env.ts"],
        include: ["test/**/*.e2e-spec.ts"]
    }
});
