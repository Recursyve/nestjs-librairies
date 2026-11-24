import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededPerson } from "./seeds/create-seeded-person";
import { createSeededProduct } from "./seeds/create-seeded-product";

function orderByStatements(sql: string[]): string[] {
    return sql.filter((query) => /order by/i.test(query));
}

function expectFilterSucceededWithoutSql(response: { status: number }, sql: string[], forbidden: string | RegExp): void {
    expect(sql.some((query) => /select/i.test(query))).toBe(true);
    expect(response.status).toBe(200);
    const statements = sql.join("\n");
    if (typeof forbidden === "string") {
        expect(statements).not.toContain(forbidden);
    } else {
        expect(statements).not.toMatch(forbidden);
    }
    expect(orderByStatements(sql).join("\n")).not.toMatch(/\*\s*\(\s*-1\s*\)/);
}

describe("order.column identifier safety", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("still sorts by a real column", async () => {
        await using first = await createSeededPerson({
            email: "first@example.com",
            first_name: "First",
            last_name: "One"
        });
        await using second = await createSeededPerson({
            email: "second@example.com",
            first_name: "Second",
            last_name: "Two"
        });

        const response = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            order: [{ column: "id", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const ids = TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response)).filter((id) =>
            [first.id, second.id].includes(id)
        );
        expect(ids).toEqual([first.id, second.id]);
    });

    it("does not execute a quoting breakout in order.column", async () => {
        await using first = await createSeededPerson({
            email: "low@example.com",
            first_name: "Low",
            last_name: "One"
        });
        await using second = await createSeededPerson({
            email: "high@example.com",
            first_name: "High",
            last_name: "Two"
        });

        const breakoutColumn = "id`*(-1),`id";
        const { result: response, sql } = await harness.captureSql(() =>
            harness.postFilter("persons", {
                page: TestHarness.defaultPage,
                order: [{ column: breakoutColumn, direction: "asc" }],
                query: { condition: "and", rules: [] }
            })
        );

        expectFilterSucceededWithoutSql(response, sql, breakoutColumn);
        const ids = TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response)).filter((id) =>
            [first.id, second.id].includes(id)
        );
        expect(ids).not.toEqual([second.id, first.id]);
    });

    it("does not execute a quoting breakout through an association path", async () => {
        await using first = await createSeededPerson({
            email: "assoc-low@example.com",
            first_name: "Low",
            last_name: "One"
        });
        await using second = await createSeededPerson({
            email: "assoc-high@example.com",
            first_name: "High",
            last_name: "Two"
        });

        const breakoutColumn = "coord.id`*(-1),`id";
        const { result: response, sql } = await harness.captureSql(() =>
            harness.postFilter("persons", {
                page: TestHarness.defaultPage,
                order: [{ column: breakoutColumn, direction: "asc" }],
                query: { condition: "and", rules: [] }
            })
        );

        expectFilterSucceededWithoutSql(response, sql, breakoutColumn);
        const ids = TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response)).filter((id) =>
            [first.id, second.id].includes(id)
        );
        expect(ids).not.toEqual([second.id, first.id]);
    });

    it("does not interpolate an unknown order.column into SQL", async () => {
        await using _person = await createSeededPerson({
            email: "unknown-column@example.com",
            first_name: "Unknown",
            last_name: "Column"
        });

        const unknownColumn = "not_a_real_column";
        const { result: response, sql } = await harness.captureSql(() =>
            harness.postFilter("persons", {
                page: TestHarness.defaultPage,
                order: [{ column: unknownColumn, direction: "asc" }],
                query: { condition: "and", rules: [] }
            })
        );

        expectFilterSucceededWithoutSql(response, sql, unknownColumn);
    });

    it("does not let person sort order encode a product SKU the endpoint never returns", async () => {
        await using hiddenProduct = await createSeededProduct({
            metadata: { source: "oracle-canary" },
            name: "Hidden from persons filter",
            sku: "HIDDEN-PERSON-ORACLE-SKU",
            status: "active",
            tags: []
        });
        await using first = await createSeededPerson({
            email: "oracle-low@example.com",
            first_name: "Low",
            last_name: "One"
        });
        await using second = await createSeededPerson({
            email: "oracle-high@example.com",
            first_name: "High",
            last_name: "Two"
        });

        const idsForSku = async (sku: string): Promise<number[]> => {
            const response = await harness.postFilter("persons", {
                page: TestHarness.defaultPage,
                order: [
                    {
                        column: `id\`*(CASE WHEN (EXISTS (SELECT 1 FROM \`products\` WHERE \`sku\`='${sku}' AND \`deleted_at\` IS NULL)) THEN -1 ELSE 1 END),\`id`,
                        direction: "asc"
                    }
                ],
                query: { condition: "and", rules: [] }
            });

            expect(response.status).toBe(200);
            const body = TestHarness.parseFilterBody<{ id: number }>(response);
            expect(JSON.stringify(body)).not.toContain(hiddenProduct.sku);
            return TestHarness.mapFilterRowIds(body).filter((id) => [first.id, second.id].includes(id));
        };

        const orderWhenHiddenSkuExists = await idsForSku(hiddenProduct.sku);
        const orderWhenSkuMissing = await idsForSku("SKU-THAT-DOES-NOT-EXIST");

        expect(orderWhenHiddenSkuExists).toEqual(orderWhenSkuMissing);
    });

    it("does not let an ACL-limited user confirm another person's email via sort order", async () => {
        await using visibleLow = await createSeededPerson({
            email: "attacker-low@example.com",
            first_name: "Allowed",
            last_name: "Low"
        });
        await using visibleHigh = await createSeededPerson({
            email: "attacker-high@example.com",
            first_name: "Allowed",
            last_name: "High"
        });
        await using hiddenVictim = await createSeededPerson({
            email: "hidden-victim@localhost",
            first_name: "Hidden",
            last_name: "Victim"
        });

        const attacker = { id: "attacker", allowedPersonIds: [visibleLow.id, visibleHigh.id] };

        const idsForEmailGuess = async (email: string): Promise<number[]> => {
            const response = await harness.postFilter(
                "persons",
                {
                    page: TestHarness.defaultPage,
                    order: [
                        {
                            column: `id\`*(CASE WHEN (EXISTS (SELECT 1 FROM \`persons\` WHERE \`email\`='${email}' AND \`deleted_at\` IS NULL)) THEN -1 ELSE 1 END),\`id`,
                            direction: "asc"
                        }
                    ],
                    query: { condition: "and", rules: [] }
                },
                attacker
            );

            expect(response.status).toBe(200);
            const body = TestHarness.parseFilterBody<{ id: number; email?: string }>(response);
            expect(TestHarness.mapFilterRowIds(body)).not.toContain(hiddenVictim.id);
            expect(JSON.stringify(body)).not.toContain(hiddenVictim.email);
            return TestHarness.mapFilterRowIds(body).filter((id) =>
                [visibleLow.id, visibleHigh.id].includes(id)
            );
        };

        const orderWhenGuessingVictimEmail = await idsForEmailGuess(hiddenVictim.email);
        const orderWhenGuessingWrongEmail = await idsForEmailGuess("nobody@localhost");

        expect(orderWhenGuessingVictimEmail).toEqual(orderWhenGuessingWrongEmail);
    });

    it("does not let person sort order encode whether a table exists in the schema", async () => {
        await using first = await createSeededPerson({
            email: "schema-low@example.com",
            first_name: "Low",
            last_name: "One"
        });
        await using second = await createSeededPerson({
            email: "schema-high@example.com",
            first_name: "High",
            last_name: "Two"
        });

        const idsForTableGuess = async (tableName: string): Promise<number[]> => {
            const response = await harness.postFilter("persons", {
                page: TestHarness.defaultPage,
                order: [
                    {
                        column: `id\`*(CASE WHEN (EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='${tableName}')) THEN -1 ELSE 1 END),\`id`,
                        direction: "asc"
                    }
                ],
                query: { condition: "and", rules: [] }
            });

            expect(response.status).toBe(200);
            const body = TestHarness.parseFilterBody<{ id: number }>(response);
            expect(JSON.stringify(body)).not.toMatch(/information_schema/i);
            return TestHarness.mapFilterRowIds(body).filter((id) => [first.id, second.id].includes(id));
        };

        const orderWhenGuessingExistingTable = await idsForTableGuess("persons");
        const orderWhenGuessingMissingTable = await idsForTableGuess("no_such_table_zzzz");

        expect(orderWhenGuessingExistingTable).toEqual(orderWhenGuessingMissingTable);
    });
});
