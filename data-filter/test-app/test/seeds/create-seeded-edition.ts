import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Editions } from "../../src/editions/models/editions.model";
import { Seeded } from "./seeded.type";

type CreateSeededEditionParams = {
    code: string;
    metadata?: Record<string, unknown>;
    status?: string;
    title: string;
};

type SeededEdition = Seeded<{
    id: number;
    code: string;
    metadata: Record<string, unknown> | undefined;
    status: string | undefined;
    title: string;
}>;

export async function createSeededEdition(params: CreateSeededEditionParams): Promise<SeededEdition> {
    const row = await Editions.create(params);
    if (!arePropertiesDefined(row, "id", "code", "title")) {
        throw new Error("Failed to seed edition");
    }

    return {
        id: row.id,
        code: row.code,
        metadata: row.metadata,
        status: row.status,
        title: row.title,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}
