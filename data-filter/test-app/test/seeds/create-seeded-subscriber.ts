import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Subscribers } from "../../src/subscribers/models/subscribers.model";
import { Seeded } from "./seeded.type";

type CreateSeededSubscriberParams = {
    display_name: string;
    email: string;
};

type SeededSubscriber = Seeded<{
    id: number;
    display_name: string;
    email: string;
}>;

export async function createSeededSubscriber(params: CreateSeededSubscriberParams): Promise<SeededSubscriber> {
    const row = await Subscribers.create(params);
    if (!arePropertiesDefined(row, "id", "display_name", "email")) {
        throw new Error("Failed to seed subscriber");
    }

    return {
        id: row.id,
        display_name: row.display_name,
        email: row.email,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}
