import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Museums } from "../../src/museums/models/museums.model";
import { Seeded } from "./seeded.type";

type CreateSeededMuseumParams = {
    name: string;
};

type SeededMuseum = Seeded<{
    id: number;
    name: string;
}>;

export async function createSeededMuseum(params: CreateSeededMuseumParams): Promise<SeededMuseum> {
    const museum = await Museums.create(params);
    if (!arePropertiesDefined(museum, "id", "name")) {
        throw new Error("Failed to seed museum");
    }

    return {
        id: museum.id,
        name: museum.name,
        async [Symbol.asyncDispose]() {
            await museum.destroy({ force: true });
        }
    };
}
