import { Inject, Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { NiceTransaction } from "./transaction";

@Injectable()
export class SequelizeTransactionService {
    @Inject()
    private sequelize: Sequelize;

    public async transaction<T>(autoCallback: (t: NiceTransaction) => PromiseLike<T>): Promise<T> {
        const transaction = new NiceTransaction(this.sequelize, {});
        try {
            await (transaction as any).prepareEnvironment();
            const result = await autoCallback(transaction);
            await transaction.commit();

            return await result;
        } catch (error) {
            try {
                if (!(transaction as any).finished) {
                    await transaction.rollback();
                } else {
                    // release the connection, even if we don't need to rollback
                    await (transaction as any).cleanup();
                }
            } catch {
                // ignore
            }

            throw error;
        }
    }
}
