import type { NiceTransaction } from "./transaction";

export type SequelizeManagedTransaction = NiceTransaction & {
    prepareEnvironment(): Promise<void>;
    finished: boolean;
    cleanup(): Promise<void>;
};

export function asSequelizeManagedTransaction(transaction: NiceTransaction): SequelizeManagedTransaction {
    return transaction as SequelizeManagedTransaction;
}
