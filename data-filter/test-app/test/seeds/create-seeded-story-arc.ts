import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { StoryArcs } from "../../src/story-arcs/models/story-arcs.model";
import { Seeded } from "./seeded.type";

type CreateSeededStoryArcParams = {
    genre: string;
    title: string;
};

type SeededStoryArc = Seeded<{
    id: number;
    genre: string;
    title: string;
}>;

export async function createSeededStoryArc(params: CreateSeededStoryArcParams): Promise<SeededStoryArc> {
    const row = await StoryArcs.create(params);
    if (!arePropertiesDefined(row, "id", "genre", "title")) {
        throw new Error("Failed to seed story arc");
    }

    return {
        id: row.id,
        genre: row.genre,
        title: row.title,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}
