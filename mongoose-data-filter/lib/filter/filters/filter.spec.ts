import { Filter } from "./filter";
import { TextFilter } from "./text.filter";
import { FilterOperatorTypes } from "../operators";
import { col, fn, Op, where, WhereOptions } from "sequelize";

describe("Filter", () => {
    describe("getWhereOptions", () => {
        it("should return a valid filter config", async () => {
            const filter = new TextFilter({
                attribute: "test"
            });
            const options = await filter.getMatchOptions({
                id: "test",
                value: "test",
                operation: FilterOperatorTypes.Equal
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                test: "test"
            });
        });

        it("with custom name should return a valid filter config", async () => {
            const filter = new TextFilter({
                attribute: "test"
            });
            const options = await filter.getMatchOptions({
                id: "test",
                value: "test",
                operation: FilterOperatorTypes.Equal
            }, "customName");
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                customName: "test"
            });
        });

        it("with path should return a valid filter config", async () => {
            const filter = new TextFilter({
                attribute: "test",
                path: "path.to.attribute"
            });
            const options = await filter.getMatchOptions({
                id: "test",
                value: "test",
                operation: FilterOperatorTypes.Equal
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                "$path.to.attribute.test$": "test"
            });
        });

        it("with custom operator should return a valid filter config", async () => {
            const filter = new TextFilter({
                attribute: "test"
            }).addOperators({
                name: "test",
                operator: FilterOperatorTypes.Contains
            });
            const options = await filter.getMatchOptions({
                id: "test",
                value: "test",
                operation: "test"
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual<WhereOptions>({
                test: {
                    [Op.like]: "%test%"
                }
            });
        });

        it("with having defined should return null", async () => {
            const filter = new TextFilter({
                attribute: "test",
                having:fn("count", col("test.email"))
            });
            const options = await filter.getMatchOptions({
                id: "test",
                value: "test",
                operation: "test"
            });
            expect(options).toBeNull();
        });
    });

    describe("getHavingOptions", () => {
        it("with no having defined should return null", async () => {
            const filter = new TextFilter({
                attribute: "test"
            });
            const options = await filter.getHavingOptions({
                id: "test",
                value: "test",
                operation: FilterOperatorTypes.Equal
            });
            expect(options).toBeNull();
        });

        it("with having defined should return a valid filter config", async () => {
            const filter = new TextFilter({
                attribute: "test",
                having: fn("count", col("test.email"))
            });
            const options = await filter.getHavingOptions({
                id: "test",
                value: 0,
                operation: FilterOperatorTypes.Equal
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual(where(fn("count", col("test.email")), 0 as any));
        });

        it("with custom operator should return a valid filter config", async () => {
            const filter = new TextFilter({
                attribute: "test"
            }).addOperators({
                name: "none",
                having: where(fn("count", col("system.place.owners.person.email")), {
                    [Op.lte]: 0
                })
            });
            const options = await filter.getHavingOptions({
                id: "test",
                value: null,
                operation: "none"
            });
            expect(options).toBeDefined();
            expect(options).toStrictEqual(where(fn("count", col("system.place.owners.person.email")), {
                [Op.lte]: 0
            }));
        });
    });
});
