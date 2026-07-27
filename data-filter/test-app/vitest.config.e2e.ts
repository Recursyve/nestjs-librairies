import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [swc.vite()],
    test: {
        globals: true,
        pool: "forks",
        maxWorkers: 1,
        fileParallelism: false,
        globalSetup: ["./test/harness/global-setup.ts"],
        setupFiles: ["./test/harness/setup-env.ts"],
        include: ["test/**/*.e2e-spec.ts"]
    }
});
