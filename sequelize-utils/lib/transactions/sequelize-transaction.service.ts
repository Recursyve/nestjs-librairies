import { Inject, Injectable } from "@nestjs/common";
import type { TransactionOptions } from "sequelize";
import { Sequelize } from "sequelize-typescript";

import { asSequelizeManagedTransaction } from "./sequelize-managed-transaction";
import { NiceTransaction } from "./transaction";

export interface NiceTransactionOptions extends TransactionOptions {
    transaction?: NiceTransaction;
    useSavePoints?: boolean;
}

@Injectable()
export class SequelizeTransactionService {
    @Inject()
    private readonly sequelize!: Sequelize;

    public transaction<T>(
        options: NiceTransactionOptions,
        autoCallback: (t: NiceTransaction) => PromiseLike<T>
    ): Promise<T>;

    public transaction<T>(autoCallback: (t: NiceTransaction) => PromiseLike<T>): Promise<T>;

    public transaction(options?: NiceTransactionOptions): Promise<NiceTransaction>;

    public async transaction<T>(
        optionsOrAutoCallback?: NiceTransactionOptions | ((t: NiceTransaction) => PromiseLike<T>),
        _autoCallback?: (t: NiceTransaction) => PromiseLike<T>
    ): Promise<NiceTransaction | T> {
        let options: NiceTransactionOptions = {};
        let autoCallback: ((t: NiceTransaction) => PromiseLike<T>) | null = null;

        if (_autoCallback) {
            autoCallback = _autoCallback;
            options = optionsOrAutoCallback as NiceTransactionOptions;
        }

        if (optionsOrAutoCallback instanceof Function) {
            autoCallback = optionsOrAutoCallback;
        } else if (optionsOrAutoCallback !== undefined) {
            options = optionsOrAutoCallback;
        }

        if (options.transaction && options.useSavePoints !== true) {
            if (!autoCallback) {
                return options.transaction;
            }

            return autoCallback(options.transaction);
        }

        const transaction = asSequelizeManagedTransaction(new NiceTransaction(this.sequelize, options));
        if (!autoCallback) {
            return transaction;
        }

        try {
            await transaction.prepareEnvironment();
            const result = await autoCallback(transaction);
            await transaction.commit();

            return result;
        } catch (error) {
            try {
                if (!transaction.finished) {
                    await transaction.rollback();
                } else {
                    // release the connection, even if we don't need to rollback
                    await transaction.cleanup();
                }
            } catch {
                // ignore
            }

            throw error;
        }
    }
}
