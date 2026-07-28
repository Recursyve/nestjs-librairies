import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { RawEvents } from "../../src/raw-events/models/raw-events.model";
import { Seeded } from "./seeded.type";

type CreateSeededRawEventParams = {
    event_name: string;
    source: string;
};

type SeededRawEvent = Seeded<{
    id: number;
    event_name: string;
    source: string;
}>;

export async function createSeededRawEvent(params: CreateSeededRawEventParams): Promise<SeededRawEvent> {
    const row = await RawEvents.create(params);
    if (!arePropertiesDefined(row, "id", "event_name", "source")) {
        throw new Error("Failed to seed raw event");
    }

    return {
        id: row.id,
        event_name: row.event_name,
        source: row.source,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}
