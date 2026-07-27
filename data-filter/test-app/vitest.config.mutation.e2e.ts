import path from "node:path";
import { fileURLToPath } from "node:url";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

const testAppRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest config for Stryker mutation runs.
 * Runs the full E2E characterization suite; mutation scope is controlled by stryker.config.mjs.
 */
export default defineConfig({
    root: testAppRoot,
    plugins: [swc.vite()],
    test: {
        globals: true,
        pool: "forks",
        maxWorkers: 1,
        fileParallelism: false,
        globalSetup: [path.join(testAppRoot, "test/setup/global-setup.ts")],
        setupFiles: [path.join(testAppRoot, "test/setup/setup-env.ts")],
        include: ["test/**/*.e2e-spec.ts"]
    }
});
