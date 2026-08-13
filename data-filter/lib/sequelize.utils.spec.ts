import { Op } from "sequelize";
import { SequelizeUtils } from "./sequelize.utils";

describe("SequelizeUtils", () => {
    describe("mergeAttributes", () => {
        it("Merge no attributes should return no attributes", () => {
            const a = undefined;
            const b = undefined;

            const res = SequelizeUtils.mergeAttributes(a, b);
            expect(res).toEqual(undefined);
        });

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

        it("Merge array and no attributes should return no attributes", () => {
            const a = ["id", "name"];
            const b = undefined;

            const res = SequelizeUtils.mergeAttributes(a, b);
            expect(res).toEqual(undefined);

            const a2 = undefined;
            const b2 = ["id", "name"];

            const res2 = SequelizeUtils.mergeAttributes(a2, b2);
            expect(res2).toEqual(undefined);
        });

        it("Merge include object and no attributes should return the include object", () => {
            const a = { include: ["new_attr"] };
            const b = undefined;

            const res = SequelizeUtils.mergeAttributes(a, b);
            expect(res).toEqual({ include: ["new_attr"] });

            const a2 = undefined;
            const b2 = { include: ["new_attr"] };

            const res2 = SequelizeUtils.mergeAttributes(a2, b2);
            expect(res2).toEqual({ include: ["new_attr"] });
        });

        it("Merge include empty object and empty attributes should return the attribute with the id", () => {
            const a = { include: [] };
            const b: any[] = [];

            const res = SequelizeUtils.mergeAttributes(a, b);
            expect(res).toEqual(["id"]);

            const a2: any[] = [];
            const b2 = { include: [] };

            const res2 = SequelizeUtils.mergeAttributes(a2, b2);
            expect(res2).toEqual(["id"]);
        });

        it("Merge two empty attribute arrays should stay empty", () => {
            expect(SequelizeUtils.mergeAttributes([], [])).toEqual([]);
        });
    });

    describe("whereToSqlCondition", () => {
        it("renders null as IS NULL against the include alias", () => {
            expect(SequelizeUtils.whereToSqlCondition({ exportedAt: null }, "jobApplications")).toBe(
                "`jobApplications`.`exportedAt` IS NULL"
            );
        });

        it("renders Op.not null as IS NOT NULL against the include alias", () => {
            expect(SequelizeUtils.whereToSqlCondition({ exportedAt: { [Op.not]: null } }, "jobApplications")).toBe(
                "`jobApplications`.`exportedAt` IS NOT NULL"
            );
        });

        it("renders comparison operators", () => {
            expect(SequelizeUtils.whereToSqlCondition({ quantity: { [Op.gte]: 5 } }, "lines")).toBe(
                "`lines`.`quantity` >= 5"
            );
        });
    });

    describe("hasGroupOption", () => {
        it("treats an empty array as no group", () => {
            expect(SequelizeUtils.hasGroupOption([])).toBe(false);
            expect(SequelizeUtils.hasGroupOption(undefined)).toBe(false);
        });

        it("treats a non-empty group as grouped", () => {
            expect(SequelizeUtils.hasGroupOption(["id"])).toBe(true);
            expect(SequelizeUtils.hasGroupOption("id")).toBe(true);
        });
    });

    describe("stripIncludeAttributes", () => {
        it("clears columns on joined includes", () => {
            expect(
                SequelizeUtils.stripIncludeAttributes({
                    as: "lines",
                    attributes: ["id", "sku"],
                    include: [{ as: "warehouse", attributes: ["code"] }]
                })
            ).toEqual([
                {
                    as: "lines",
                    attributes: [],
                    include: [{ as: "warehouse", attributes: [], include: [] }]
                }
            ]);
        });

        it("keeps columns on separate includes", () => {
            const separate = {
                as: "artifacts",
                attributes: ["id", "title"],
                separate: true,
                include: [{ as: "museum", attributes: ["name"] }]
            };
            expect(SequelizeUtils.stripIncludeAttributes(separate)).toEqual([separate]);
        });
    });
});
