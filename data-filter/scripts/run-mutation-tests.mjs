#!/usr/bin/env node
// @ts-nocheck
/**
 * Runs Stryker with one shared MySQL Testcontainer for the whole campaign.
 * Normal `npm run test:e2e` is unchanged and still starts/stops its own container per Vitest run.
 */
import { MySqlContainer } from "@testcontainers/mysql";
import { execSync, spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

const repoRoot = new URL("..", import.meta.url).pathname;

// One full rebuild per campaign; per-mutant builds use incremental tsc. Stryker vitest runner reuses one Vitest process.
execSync("npm run build:lib", { cwd: repoRoot, stdio: "inherit" });

async function startSharedMysql() {
    const container = await new MySqlContainer("mysql:8.4")
        .withDatabase("test")
        .withUsername("test")
        .withUserPassword("test")
        .withRootPassword("root")
        .start();

    return {
        container,
        env: {
            MUTATION_MYSQL_REUSE: "1",
            DB_HOST: container.getHost(),
            DB_PORT: String(container.getPort()),
            DB_NAME: container.getDatabase(),
            DB_USERNAME: container.getUsername(),
            DB_PASSWORD: container.getUserPassword(),
        },
    };
}

function runStryker(extraEnv) {
    const strykerArgs = ["stryker", "run", ...process.argv.slice(2)];

    return new Promise((resolve, reject) => {
        const child = spawn("npx", strykerArgs, {
            cwd: repoRoot,
            env: { ...process.env, TZ: "UTC", ...extraEnv },
            stdio: "inherit",
        });

        child.on("error", reject);
        child.on("close", (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(`stryker exited with code ${code}`));
        });
    });
}

const started = performance.now();
const { container, env } = await startSharedMysql();
let stopped = false;

async function stopContainer() {
    if (stopped) {
        return;
    }

    stopped = true;
    await container.stop();
}

async function shutdown(code) {
    await stopContainer();
    process.exit(code);
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));

try {
    await runStryker(env);
    await stopContainer();
    const elapsedSec = ((performance.now() - started) / 1000).toFixed(1);
    console.log(`Mutation campaign finished in ${elapsedSec}s (shared MySQL container).`);
} catch (error) {
    console.error(error);
    await stopContainer();
    process.exit(1);
}
