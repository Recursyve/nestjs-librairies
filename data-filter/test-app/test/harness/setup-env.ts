import { inject } from "vitest";

export interface MysqlEnv {
    DB_HOST: string;
    DB_PORT: string;
    DB_NAME: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
}

const mysqlEnv = inject("mysqlEnv");
Object.assign(process.env, mysqlEnv);

declare module "vitest" {
    export interface ProvidedContext {
        mysqlEnv: MysqlEnv;
    }
}
