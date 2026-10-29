import { vi } from "vitest";

import { NiceTransaction } from "../lib/index";

export function mockManagedTransactionLifecycle(): void {
    vi.spyOn(
        NiceTransaction.prototype as NiceTransaction & { prepareEnvironment: () => Promise<void> },
        "prepareEnvironment"
    ).mockResolvedValue(undefined);
}
