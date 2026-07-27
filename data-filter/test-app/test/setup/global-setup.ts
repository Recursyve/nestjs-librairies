import { MySqlContainer } from "@testcontainers/mysql";
import type { TestProject } from "vitest/node";
import { MysqlEnv } from "./setup-env";

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

    const mysqlEnv: MysqlEnv = {
        DB_HOST: mysqlContainer.getHost(),
        DB_NAME: mysqlContainer.getDatabase(),
        DB_PASSWORD: mysqlContainer.getUserPassword(),
        DB_PORT: String(mysqlContainer.getPort()),
        DB_USERNAME: mysqlContainer.getUsername()
    };
    provide("mysqlEnv", mysqlEnv);

    return async () => {
        await mysqlContainer.stop();
    };
}
