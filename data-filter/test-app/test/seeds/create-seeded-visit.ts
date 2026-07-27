import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Visits } from "../../src/visits/models/visits.model";
import { Seeded } from "./seeded.type";

type CreateSeededVisitParams = {
    type: string;
    visit_date: string;
    visit_time: string;
};

type SeededVisit = Seeded<{
    id: number;
    type: string;
    visit_date: string;
    visit_time: string;
}>;

export async function createSeededVisit(params: CreateSeededVisitParams): Promise<SeededVisit> {
    const row = await Visits.create(params);
    if (!arePropertiesDefined(row, "id", "type", "visit_date", "visit_time")) {
        throw new Error("Failed to seed visit");
    }

    return {
        id: row.id,
        type: row.type,
        visit_date: row.visit_date,
        visit_time: row.visit_time,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}
