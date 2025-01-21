import { Inject, Injectable } from "@nestjs/common";
import { TransactionOptions } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { NiceTransaction } from "./transaction";

export interface NiceTransactionOptions extends TransactionOptions {
    transaction?: NiceTransaction;
    useSavePoints?: boolean;
}

@Injectable()
export class SequelizeTransactionService {
    @Inject()
    private sequelize!: Sequelize;

    public transaction<T>(options: NiceTransactionOptions, autoCallback: (t: NiceTransaction) => PromiseLike<T>): Promise<T>;
    public transaction<T>(autoCallback: (t: NiceTransaction) => PromiseLike<T>): Promise<T>;
    public transaction(options?: NiceTransactionOptions): Promise<NiceTransaction>;
    public async transaction<T>(optionsOrAutoCallback?: NiceTransactionOptions | ((t: NiceTransaction) => PromiseLike<T>), _autoCallback?:(t: NiceTransaction) => PromiseLike<T>): Promise<T | NiceTransaction> {
        let options: NiceTransactionOptions = {};
        let autoCallback: ((t: NiceTransaction) => PromiseLike<T>) | null = null;

        if (_autoCallback) {
            autoCallback = _autoCallback;
            options = optionsOrAutoCallback as NiceTransactionOptions;
        }

        if (optionsOrAutoCallback instanceof Function) {
            autoCallback = optionsOrAutoCallback as (t: NiceTransaction) => PromiseLike<T>;
        } else {
            options = optionsOrAutoCallback as NiceTransactionOptions;
        }

        if (options.transaction && !options.useSavePoints) {
            if (!autoCallback) {
                return options.transaction;
            }

            return await autoCallback(options.transaction);
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
