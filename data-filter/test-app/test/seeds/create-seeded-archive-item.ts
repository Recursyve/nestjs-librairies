import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { ArchiveItems } from "../../src/archive-items/models/archive-items.model";
import { Seeded } from "./seeded.type";

type CreateSeededArchiveItemParams = {
    status: string;
    title: string;
};

type SeededArchiveItem = Seeded<{
    id: number;
    status: string;
    title: string;
}>;

export async function createSeededArchiveItem(params: CreateSeededArchiveItemParams): Promise<SeededArchiveItem> {
    const row = await ArchiveItems.create(params);
    if (!arePropertiesDefined(row, "id", "status", "title")) {
        throw new Error("Failed to seed archive item");
    }

    return {
        id: row.id,
        status: row.status,
        title: row.title,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

export async function softDeleteArchiveItem(id: number): Promise<void> {
    await ArchiveItems.destroy({ where: { id } });
}
