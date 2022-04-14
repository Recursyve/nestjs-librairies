import { SequelizeUtils } from "./sequelize.utils";

describe("SequelizeUtils", () => {
    describe("mergeAttributes", () => {
        it("Merge array attributes should merge in one array", () => {
            const a = ["id", "name"];
            const b = ["email", "phone"];

            const res = SequelizeUtils.mergeAttributes(a, b);
            expect(res).toEqual(["id", "name", "email", "phone"]);
        });

        it("Merge two include objects should return a valid object", () => {
            const a = { include: ["new_attr"] };
            const b = { include: ["other_new_attr"] };

            const res = SequelizeUtils.mergeAttributes(a, b);
            expect(res).toEqual({ include: ["new_attr", "other_new_attr"] });
        });

        it("Merge two exclude objects should return a valid object", () => {
            const a = { exclude: ["attr_to_remove"] };
            const b = { exclude: ["other_attr_to_remove"] };

            const res = SequelizeUtils.mergeAttributes(a, b);
            expect(res).toEqual({ exclude: ["attr_to_remove", "other_attr_to_remove"] });
        });
    });
});
