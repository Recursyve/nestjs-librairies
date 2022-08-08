import { Transaction } from "sequelize";

type AfterTransactionRollbackCallback = (transaction: Transaction) => void | Promise<void>;

export class NiceTransaction extends Transaction {
    private readonly _afterRollbackHooks: Set<AfterTransactionRollbackCallback> = new Set();

    /** Pretty much a copy and paste of the afterCommit of the original Transaction of Sequelize */
    public afterRollback(fn: AfterTransactionRollbackCallback): this {
        if (typeof fn !== 'function') {
            throw new TypeError('"fn" must be a function');
        }

        this._afterRollbackHooks.add(fn);

        return this;
    }

    public async rollback(): Promise<void> {
        await super.rollback();

        /** Pretty much a copy and paste of the afterCommit of the original Transaction of Sequelize */
        for (const hook of this._afterRollbackHooks) {
            await Reflect.apply(hook, this, [this]);
        }
    }
}
