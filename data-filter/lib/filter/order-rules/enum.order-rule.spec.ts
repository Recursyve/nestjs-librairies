import { Literal } from "sequelize/types/utils";
import { EnumOrderRule } from "./enum.order-rule";

describe("EnumOrderRule", () => {
    describe("getOrderOption", () => {
        it("should return a valid order option", async () => {
            const filter = new EnumOrderRule({
                attribute: "test",
                priorities: ["one", "two", "three"]
            });
            const order = await filter.getOrderOption();
            expect(order).toBeDefined();
            expect((order as Literal).val).toEqual(
                "CASE test WHEN 'one' THEN 3 WHEN 'two' THEN 2 WHEN 'three' THEN 1 ELSE 0 END"
            )
        });
    });
});
