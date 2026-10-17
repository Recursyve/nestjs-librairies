import { Transaction } from "sequelize";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createSequelizeStub } from "../../tests/sequelize.stub";
import { NiceTransaction } from "./transaction";

describe(NiceTransaction, () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("rejects non-function afterRollback callbacks", () => {
        expect.assertions(1);

        const transaction = new NiceTransaction(createSequelizeStub(), {});

        expect(() => {
            transaction.afterRollback("not-a-function" as never);
        }).toThrow(TypeError);
    });

    it("runs afterRollback hooks when rollback completes", async () => {
        expect.assertions(1);

        vi.spyOn(Transaction.prototype, "rollback").mockResolvedValue(undefined);

        const transaction = new NiceTransaction(createSequelizeStub(), {});
        const hook = vi.fn<(transaction: Transaction) => void>();

        transaction.afterRollback(hook);
        await transaction.rollback();

        expect(hook).toHaveBeenCalledExactlyOnceWith(transaction);
    });
});
