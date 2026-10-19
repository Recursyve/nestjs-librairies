import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSequelizeStub } from "../../tests/sequelize.stub";
import { mockManagedTransactionLifecycle } from "../../tests/transaction-test.harness";
import { SequelizeTransactionService } from "./sequelize-transaction.service";
import { NiceTransaction } from "./transaction";

const sequelize = createSequelizeStub();

describe(SequelizeTransactionService, () => {
    let underTest: SequelizeTransactionService;

    beforeEach(() => {
        underTest = new SequelizeTransactionService();
        Object.assign(underTest, { sequelize });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("reuses an existing transaction when useSavePoints is disabled", async () => {
        expect.assertions(1);

        const existing = new NiceTransaction(sequelize, {});

        const result = await underTest.transaction({ transaction: existing }, async (transaction) =>
            Promise.resolve(transaction === existing)
        );

        expect(result).toBe(true);
    });

    it("returns the existing transaction when no callback is provided", async () => {
        expect.assertions(1);

        const existing = new NiceTransaction(sequelize, {});

        await expect(underTest.transaction({ transaction: existing })).resolves.toBe(existing);
    });

    it("returns a new transaction when invoked without options", async () => {
        expect.assertions(1);

        await expect(underTest.transaction()).resolves.toBeInstanceOf(NiceTransaction);
    });

    it("returns the callback result on success", async () => {
        expect.assertions(1);

        mockManagedTransactionLifecycle();
        vi.spyOn(NiceTransaction.prototype, "commit").mockResolvedValue(undefined);

        await expect(underTest.transaction(async () => Promise.resolve(42))).resolves.toBe(42);
    });

    it("commits the transaction on success", async () => {
        expect.assertions(1);

        mockManagedTransactionLifecycle();
        const commit = vi.spyOn(NiceTransaction.prototype, "commit").mockResolvedValue(undefined);

        await underTest.transaction(async () => Promise.resolve(42));

        expect(commit).toHaveBeenCalledTimes(1);
    });

    it("rethrows when the callback fails", async () => {
        expect.assertions(1);

        mockManagedTransactionLifecycle();
        vi.spyOn(NiceTransaction.prototype, "rollback").mockResolvedValue(undefined);

        await expect(
            underTest.transaction(() => {
                throw new Error("transaction failed");
            })
        ).rejects.toThrow("transaction failed");
    });

    it("rolls back when the callback fails", async () => {
        expect.assertions(1);

        mockManagedTransactionLifecycle();
        const rollback = vi.spyOn(NiceTransaction.prototype, "rollback").mockResolvedValue(undefined);

        try {
            await underTest.transaction(() => {
                throw new Error("transaction failed");
            });
        } catch {
            // expected
        }

        expect(rollback).toHaveBeenCalledTimes(1);
    });
});
