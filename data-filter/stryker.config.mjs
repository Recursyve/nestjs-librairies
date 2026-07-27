/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
    packageManager: "npm",
    plugins: ["@stryker-mutator/vitest-runner"],
    testRunner: "vitest",
    reporters: ["clear-text", "progress", "html"],
    htmlReporter: {
        fileName: "reports/mutation/mutation-report.html",
    },
    buildCommand: "npm run build:lib:mutation",
    // Workspace: test-app resolves the lib via file:.. → dist/; sandboxing breaks that path.
    inPlace: true,
    coverageAnalysis: "off",
    mutate: [
        "lib/data-filter.repository.ts:415-471",
        "lib/filter/filter.service.ts:163-204",
        "lib/filter/filter.service.ts:206-238",
        "lib/filter/filter.service.ts:438-445",
        "lib/filter/filter.service.ts:477-487",
        "lib/filter/filter.service.ts:489-551",
        "lib/filter/filter.service.ts:553-578",
        "lib/filter/filters/geo-bounds.filter.ts:34-49",
        "lib/sequelize.utils.ts:215-277",
    ],
    ignorePatterns: ["dist/**", "coverage/**", "reports/**", ".stryker-tmp/**", "**/*.spec.ts", "test-app/dist/**"],
    concurrency: 4,
    timeoutMS: 300_000,
    vitest: {
        configFile: "test-app/vitest.config.mutation.e2e.ts",
        // E2E specs do not import lib/; default related:true finds 0 tests.
        related: false,
    },
};
