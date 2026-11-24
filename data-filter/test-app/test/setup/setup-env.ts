import { inject } from "vitest";

export interface MysqlEnv {
    DB_HOST: string;
    DB_PORT: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME?: string;
    DB_NAME_PREFIX?: string;
}

function resolveWorkerIndex(): number {
    const raw = Number(process.env.VITEST_POOL_ID ?? 1);
    return raw > 0 ? raw : 1;
}

function resolveDatabaseName(mysqlEnv: MysqlEnv): string {
    if (mysqlEnv.DB_NAME) {
        return mysqlEnv.DB_NAME;
    }

    if (!mysqlEnv.DB_NAME_PREFIX) {
        throw new Error("mysqlEnv must provide DB_NAME or DB_NAME_PREFIX");
    }

    return `${mysqlEnv.DB_NAME_PREFIX}_${resolveWorkerIndex()}`;
}

const mysqlEnv = inject("mysqlEnv");
Object.assign(process.env, {
    DB_HOST: mysqlEnv.DB_HOST,
    DB_PORT: mysqlEnv.DB_PORT,
    DB_USERNAME: mysqlEnv.DB_USERNAME,
    DB_PASSWORD: mysqlEnv.DB_PASSWORD,
    DB_NAME: resolveDatabaseName(mysqlEnv)
});

declare module "vitest" {
    export interface ProvidedContext {
        mysqlEnv: MysqlEnv;
    }
}
