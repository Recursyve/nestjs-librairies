import type { Sequelize } from "sequelize-typescript";

export function createSequelizeStub(): Sequelize {
    return {
        options: {
            transactionType: undefined,
            isolationLevel: undefined
        },
        dialect: {
            queryGenerator: {
                generateTransactionId: () => "test-transaction-id"
            }
        }
    } as unknown as Sequelize;
}
