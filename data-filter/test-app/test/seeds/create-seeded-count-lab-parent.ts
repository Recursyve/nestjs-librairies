import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { CountLabParents } from "../../src/count-lab/models/count-lab-parents.model";
import { Seeded } from "./seeded.type";

type CreateSeededCountLabParentParams = {
    code: string;
};

type SeededCountLabParent = Seeded<{
    id: number;
    code: string;
}>;

export async function createSeededCountLabParent(
    params: CreateSeededCountLabParentParams
): Promise<SeededCountLabParent> {
    const parent = await CountLabParents.create(params);
    if (!arePropertiesDefined(parent, "id", "code")) {
        throw new Error("Failed to seed count lab parent");
    }

    return {
        id: parent.id,
        code: parent.code,
        async [Symbol.asyncDispose]() {
            await parent.destroy({ force: true });
        }
    };
}
