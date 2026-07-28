import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { CountLabChildren } from "../../src/count-lab/models/count-lab-children.model";
import { Seeded } from "./seeded.type";

type CreateSeededCountLabChildParams = {
    label: string;
    parent_id: number;
};

type SeededCountLabChild = Seeded<{
    id: number;
    label: string;
    parent_id: number;
}>;

export async function createSeededCountLabChild(params: CreateSeededCountLabChildParams): Promise<SeededCountLabChild> {
    const child = await CountLabChildren.create(params);
    if (!arePropertiesDefined(child, "id", "label", "parent_id")) {
        throw new Error("Failed to seed count lab child");
    }

    return {
        id: child.id,
        label: child.label,
        parent_id: child.parent_id,
        async [Symbol.asyncDispose]() {
            await child.destroy({ force: true });
        }
    };
}
