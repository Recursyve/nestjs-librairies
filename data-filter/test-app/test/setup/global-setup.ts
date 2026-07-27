import { MySqlContainer, type StartedMySqlContainer } from "@testcontainers/mysql";
import mysql from "mysql2/promise";
import type { TestProject } from "vitest/node";
import { MysqlEnv } from "./setup-env";

const E2E_WORKER_DATABASE_PREFIX = "data_filter_test";
const E2E_WORKER_DATABASE_COUNT = 8;

async function provisionWorkerDatabases(
    container: StartedMySqlContainer,
    prefix: string,
    count: number
): Promise<void> {
    const username = container.getUsername();
    const connection = await mysql.createConnection({
        host: container.getHost(),
        port: container.getPort(),
        user: "root",
        password: "root"
    });

    try {
        for (let i = 1; i <= count; i++) {
            const dbName = `${prefix}_${i}`;
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
            await connection.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${username}'@'%'`);
        }
        await connection.query("FLUSH PRIVILEGES");
    } finally {
        await connection.end();
    }
}

function readReusedMysqlEnv(): MysqlEnv | null {
    if (process.env.MUTATION_MYSQL_REUSE !== "1") {
        return null;
    }

    const { DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD } = process.env;
    if (!DB_HOST || !DB_PORT || !DB_NAME || !DB_USERNAME || !DB_PASSWORD) {
        return null;
    }

    return {
        DB_HOST,
        DB_PORT,
        DB_NAME,
        DB_USERNAME,
        DB_PASSWORD
    };
}

export default async function globalSetup({ provide }: TestProject) {
    const reused = readReusedMysqlEnv();
    if (reused) {
        provide("mysqlEnv", reused);
        return async () => {};
    }

    // MYSQL_USER cannot be "root" — the official image exits immediately if it is.
    const mysqlContainer = await new MySqlContainer("mysql:8.4")
        .withDatabase("test")
        .withUsername("test")
        .withUserPassword("test")
        .withRootPassword("root")
        .start();

    await provisionWorkerDatabases(mysqlContainer, E2E_WORKER_DATABASE_PREFIX, E2E_WORKER_DATABASE_COUNT);

    const mysqlEnv: MysqlEnv = {
        DB_HOST: mysqlContainer.getHost(),
        DB_NAME_PREFIX: E2E_WORKER_DATABASE_PREFIX,
        DB_PASSWORD: mysqlContainer.getUserPassword(),
        DB_PORT: String(mysqlContainer.getPort()),
        DB_USERNAME: mysqlContainer.getUsername()
    };
    provide("mysqlEnv", mysqlEnv);

    return async () => {
        await mysqlContainer.stop();
    };
}
