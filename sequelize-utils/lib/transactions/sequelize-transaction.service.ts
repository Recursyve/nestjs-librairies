import { Inject, Injectable } from "@nestjs/common";
import { TransactionOptions } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { NiceTransaction } from "./transaction";

@Injectable()
export class SequelizeTransactionService {
    @Inject()
    private sequelize: Sequelize;

    public transaction<T>(options: TransactionOptions, autoCallback: (t: NiceTransaction) => PromiseLike<T>): Promise<T>;
    public transaction<T>(autoCallback: (t: NiceTransaction) => PromiseLike<T>): Promise<T>;
    public transaction(options?: TransactionOptions): Promise<NiceTransaction>;
    public async transaction<T>(optionsOrAutoCallback: TransactionOptions | ((t: NiceTransaction) => PromiseLike<T>), _autoCallback?:(t: NiceTransaction) => PromiseLike<T>): Promise<T | NiceTransaction> {
        let options: TransactionOptions = {};
        let autoCallback: (t: NiceTransaction) => PromiseLike<T>;

        if (_autoCallback) {
            autoCallback = _autoCallback;
            options = optionsOrAutoCallback as TransactionOptions;
        }

        if (optionsOrAutoCallback instanceof Function) {
            autoCallback = optionsOrAutoCallback as (t: NiceTransaction) => PromiseLike<T>;
        } else {
            options = optionsOrAutoCallback as TransactionOptions;
        }

        const transaction = new NiceTransaction(this.sequelize, options);
        if (!autoCallback) {
            return transaction;
        }

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
