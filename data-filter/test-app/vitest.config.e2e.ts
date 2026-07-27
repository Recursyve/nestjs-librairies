import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [swc.vite()],
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
