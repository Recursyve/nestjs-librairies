import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Invoices } from "../../src/invoices/models/invoices.model";
import { Seeded } from "./seeded.type";

type CreateSeededInvoiceParams = {
    invoice_number: string;
    paid: boolean;
    subtotal: number;
    total_cost: number;
};

type SeededInvoice = Seeded<{
    id: number;
    invoice_number: string;
    paid: boolean;
    subtotal: number;
    total_cost: number;
}>;

export async function createSeededInvoice(params: CreateSeededInvoiceParams): Promise<SeededInvoice> {
    const row = await Invoices.create(params);
    if (!arePropertiesDefined(row, "id", "invoice_number", "paid", "subtotal", "total_cost")) {
        throw new Error("Failed to seed invoice");
    }

    return {
        id: row.id,
        invoice_number: row.invoice_number,
        paid: row.paid,
        subtotal: row.subtotal,
        total_cost: row.total_cost,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}
