import { OrderTiebreakerRule } from "./order-tiebreaker.rule";

describe("OrderTiebreakerRule", () => {
    describe("validate", () => {
        it("should accept an order tiebreaker rule", () => {
            expect(OrderTiebreakerRule.validate(new OrderTiebreakerRule({ column: "id" }))).toBe(true);
        });

        it("should reject another rule", () => {
            expect(OrderTiebreakerRule.validate({ _type: "filter" })).toBe(false);
        });
    });
});
