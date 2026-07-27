import { MySqlContainer } from "@testcontainers/mysql";
import type { TestProject } from "vitest/node";
import { MysqlEnv } from "./setup-env";

export default async function globalSetup({ provide }: TestProject) {
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
