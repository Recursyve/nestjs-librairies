import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { VoyageManifests } from "../../src/voyage-manifests/models/voyage-manifests.model";
import { Seeded } from "./seeded.type";

type CreateSeededVoyageManifestParams = {
    vessel_name: string;
    season: string;
    cargo_code: string;
};

type SeededVoyageManifest = Seeded<{
    id: number;
    vessel_name: string;
    season: string;
    cargo_code: string;
}>;

export async function createSeededVoyageManifest(
    params: CreateSeededVoyageManifestParams
): Promise<SeededVoyageManifest> {
    const row = await VoyageManifests.create(params);
    if (!arePropertiesDefined(row, "id", "vessel_name", "season", "cargo_code")) {
        throw new Error("Failed to seed voyage manifest");
    }

    return {
        id: row.id,
        vessel_name: row.vessel_name,
        season: row.season,
        cargo_code: row.cargo_code,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}
