import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { PriorityLanes } from "../../src/priority-lanes/models/priority-lanes.model";
import { Seeded } from "./seeded.type";

type CreateSeededPriorityLaneParams = {
    code: string;
    priority_level: string;
};

type SeededPriorityLane = Seeded<{
    id: number;
    code: string;
    priority_level: string;
}>;

export async function createSeededPriorityLane(params: CreateSeededPriorityLaneParams): Promise<SeededPriorityLane> {
    const row = await PriorityLanes.create(params);
    if (!arePropertiesDefined(row, "id", "code", "priority_level")) {
        throw new Error("Failed to seed priority lane");
    }

    return {
        id: row.id,
        code: row.code,
        priority_level: row.priority_level,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}
