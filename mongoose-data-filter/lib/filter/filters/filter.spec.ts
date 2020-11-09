import { MongooseFilterQuery } from "mongoose";
import { Filter } from "./filter";
import { TextFilter } from "./text.filter";
import { FilterOperatorTypes } from "../operators";

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
            expect(options).toStrictEqual<MongooseFilterQuery<any>>({
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
            expect(options).toStrictEqual<MongooseFilterQuery<any>>({
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
            expect(options).toStrictEqual<MongooseFilterQuery<any>>({
                "path.to.attribute.test": "test"
            });
        });
    });
});
