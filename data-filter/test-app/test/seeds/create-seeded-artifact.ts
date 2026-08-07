import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Artifacts } from "../../src/artifacts/models/artifacts.model";
import { Seeded } from "./seeded.type";

type CreateSeededArtifactParams = {
    museum_id: number;
    title: string;
    status: string;
    display_rank: number;
};

type SeededArtifact = Seeded<{
    id: number;
    museum_id: number;
    title: string;
    status: string;
    display_rank: number;
    softDelete: () => Promise<void>;
}>;

export async function createSeededArtifact(params: CreateSeededArtifactParams): Promise<SeededArtifact> {
    const artifact = await Artifacts.create(params);
    if (!arePropertiesDefined(artifact, "id", "museum_id", "title", "status", "display_rank")) {
        throw new Error("Failed to seed artifact");
    }

    return {
        id: artifact.id,
        museum_id: artifact.museum_id,
        title: artifact.title,
        status: artifact.status,
        display_rank: artifact.display_rank,
        softDelete: async () => {
            await artifact.destroy();
        },
        async [Symbol.asyncDispose]() {
            await artifact.destroy({ force: true });
        }
    };
}
