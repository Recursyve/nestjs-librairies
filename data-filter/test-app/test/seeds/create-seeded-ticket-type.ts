import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { TicketTypes } from "../../src/ticket-types/models/ticket-types.model";
import { Seeded } from "./seeded.type";

type CreateSeededTicketTypeParams = {
    code: string;
    label: string;
};

type SeededTicketType = Seeded<{
    id: number;
    code: string;
    label: string;
}>;

export async function createSeededTicketType(params: CreateSeededTicketTypeParams): Promise<SeededTicketType> {
    const row = await TicketTypes.create(params);
    if (!arePropertiesDefined(row, "id", "code", "label")) {
        throw new Error("Failed to seed ticket type");
    }

    return {
        id: row.id,
        code: row.code,
        label: row.label,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}
