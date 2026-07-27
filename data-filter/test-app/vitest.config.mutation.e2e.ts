import path from "node:path";
import { fileURLToPath } from "node:url";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

const testAppRoot = path.dirname(fileURLToPath(import.meta.url));

const defaultMutationSpecs = ["test/string-lists-null.e2e-spec.ts", "test/operators.e2e-spec.ts"];

/**
 * Optional comma-separated override for mutation campaigns, e.g.
 * MUTATION_TEST_SPECS=test/string-lists-null.e2e-spec.ts
 */
const mutationSpecs = process.env.MUTATION_TEST_SPECS
    ? process.env.MUTATION_TEST_SPECS.split(",").map((spec) => spec.trim())
    : defaultMutationSpecs;

/**
 * Narrow Vitest config for Stryker proof runs.
 * Exercises generateWhereValue operators via HTTP characterization without running the full 81-test suite per mutant.
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
        include: mutationSpecs
    }
});
