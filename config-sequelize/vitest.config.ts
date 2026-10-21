import type { ViteUserConfig } from "vitest/config";
import { defineConfig } from "vitest/config";

const config: ViteUserConfig = defineConfig({
    resolve: {
        dedupe: ["@nestjs/common", "@nestjs/core", "@nestjs/sequelize", "@nestjs/testing"]
    },
    test: {
        environment: "node",
        globals: false,
        include: ["src/**/*.spec.ts"],
        isolate: false,
        passWithNoTests: true,
        pool: "threads",
        setupFiles: ["src/vitest.setup.ts"]
    }
});

export default config;
