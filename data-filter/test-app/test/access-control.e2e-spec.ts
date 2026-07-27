import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededPerson } from "./seeds/create-seeded-person";

const route = "persons";

function aclUser(allowedPersonIds: number[]) {
    return { id: "test-user", allowedPersonIds };
}

describe("access control integration", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns only ACL-allowed person ids for an authorized user", async () => {
        await using allowed = await createSeededPerson({
            email: "allowed@example.com",
            first_name: "Allowed",
            last_name: "User"
        });
        await using denied = await createSeededPerson({
            email: "denied@example.com",
            first_name: "Denied",
            last_name: "User"
        });

        const response = await harness.postFilter(
            route,
            {
                page: TestHarness.defaultPage,
                query: { condition: "and", rules: [] }
            },
            aclUser([allowed.id])
        );

        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<{ id: number }>(response);
        expect(TestHarness.mapFilterRowIds(body)).toEqual([allowed.id]);
        expect(TestHarness.mapFilterRowIds(body)).not.toContain(denied.id);
    });

    it("returns an empty result set when ACL allows no person ids", async () => {
        await using _allowed = await createSeededPerson({
            email: "allowed@example.com",
            first_name: "Allowed",
            last_name: "User"
        });

        const response = await harness.postFilter(
            route,
            {
                page: TestHarness.defaultPage,
                query: { condition: "and", rules: [] }
            },
            aclUser([])
        );

        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<{ id: number }>(response);
        expect(body.total).toBe(0);
        expect(body.values).toEqual([]);
    });

    /**
     * @p0 legacy-contract
     * Observed: when access control is enabled globally but no user is deserialized, FilterService skips ACL WHERE merging.
     */
    it("currently returns all rows when the request has no deserialized user", async () => {
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

        const response = await harness.postFilter(route, {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<{ id: number }>(response);
        expect(body.total).toBe(2);
        expect(TestHarness.mapFilterRowIds(body).sort()).toEqual([first.id, second.id].sort());
    });

    it("applies ACL where conditions from adapter resources.where", async () => {
        await using scoped = await createSeededPerson({
            email: "scoped@example.com",
            first_name: "Scoped",
            last_name: "User",
            user_id: "scope-a"
        });
        await using other = await createSeededPerson({
            email: "other@example.com",
            first_name: "Other",
            last_name: "User",
            user_id: "scope-b"
        });

        const response = await harness.postFilter(
            route,
            {
                page: TestHarness.defaultPage,
                query: { condition: "and", rules: [] }
            },
            { id: "scope-a", scopeUserId: "scope-a" }
        );

        expect(response.status).toBe(200);
        expect(TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response))).toEqual([scoped.id]);
        expect(TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response))).not.toContain(
            other.id
        );
    });
});

describe("access control with filtering", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("intersects ACL with normal filter rules using adversarial rows", async () => {
        await using allowedMatch = await createSeededPerson({
            email: "acl-match-allowed@example.com",
            first_name: "Acl",
            last_name: "AllowedMatch"
        });
        await using deniedMatch = await createSeededPerson({
            email: "acl-match-denied@example.com",
            first_name: "Acl",
            last_name: "DeniedMatch"
        });
        await using allowedNoMatch = await createSeededPerson({
            email: "other-allowed@example.com",
            first_name: "Outside",
            last_name: "Allowed"
        });
        await using deniedNoMatch = await createSeededPerson({
            email: "other-denied@example.com",
            first_name: "Outside",
            last_name: "Denied"
        });

        const response = await harness.postFilter(
            route,
            {
                page: TestHarness.defaultPage,
                query: {
                    condition: "and",
                    rules: [{ id: "firstName", operation: FilterOperatorTypes.Equal, value: "Acl" }]
                }
            },
            aclUser([allowedMatch.id, allowedNoMatch.id])
        );

        expect(response.status).toBe(200);
        const ids = TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response));
        expect(ids).toEqual([allowedMatch.id]);
        expect(ids).not.toContain(deniedMatch.id);
        expect(ids).not.toContain(allowedNoMatch.id);
        expect(ids).not.toContain(deniedNoMatch.id);
    });
});

describe("access control with search", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("does not expose ACL-denied rows through search", async () => {
        await using allowed = await createSeededPerson({
            email: "alpha.team@example.com",
            first_name: "Alpha",
            last_name: "Team"
        });
        await using denied = await createSeededPerson({
            email: "beta.team@example.com",
            first_name: "Beta",
            last_name: "Team"
        });

        const response = await harness.postFilter(
            route,
            {
                page: TestHarness.defaultPage,
                search: { value: "team" },
                query: { condition: "and", rules: [] }
            },
            aclUser([allowed.id])
        );

        expect(response.status).toBe(200);
        const ids = TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response));
        expect(ids).toEqual([allowed.id]);
        expect(ids).not.toContain(denied.id);
    });
});

describe("access control with pagination", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("paginates only the ACL-visible dataset with matching totals", async () => {
        await using a = await createSeededPerson({ email: "a@example.com", first_name: "A", last_name: "One" });
        await using b = await createSeededPerson({ email: "b@example.com", first_name: "B", last_name: "Two" });
        await using c = await createSeededPerson({ email: "c@example.com", first_name: "C", last_name: "Three" });
        await using hidden = await createSeededPerson({
            email: "hidden@example.com",
            first_name: "Hidden",
            last_name: "Four"
        });

        const user = aclUser([a.id, b.id, c.id]);

        const firstPage = await harness.postFilter(
            route,
            {
                page: { number: 0, size: 2 },
                order: [{ column: "id", direction: "asc" }],
                query: { condition: "and", rules: [] }
            },
            user
        );
        const secondPage = await harness.postFilter(
            route,
            {
                page: { number: 1, size: 2 },
                order: [{ column: "id", direction: "asc" }],
                query: { condition: "and", rules: [] }
            },
            user
        );

        expect(firstPage.status).toBe(200);
        const firstBody = TestHarness.parseFilterBody<{ id: number }>(firstPage);
        expect(firstBody.total).toBe(3);
        expect(TestHarness.mapFilterRowIds(firstBody)).toEqual([a.id, b.id]);

        expect(secondPage.status).toBe(200);
        const secondBody = TestHarness.parseFilterBody<{ id: number }>(secondPage);
        expect(secondBody.total).toBe(3);
        expect(TestHarness.mapFilterRowIds(secondBody)).toEqual([c.id]);
        expect(TestHarness.mapFilterRowIds(secondBody)).not.toContain(hidden.id);
    });
});

describe("access control with filter-count", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns the same authorized count from filter-count as filter total", async () => {
        await using allowed = await createSeededPerson({
            email: "allowed@example.com",
            first_name: "Allowed",
            last_name: "User"
        });
        await using denied = await createSeededPerson({
            email: "denied@example.com",
            first_name: "Denied",
            last_name: "User"
        });

        const query = {
            page: TestHarness.defaultPage,
            search: { value: "example" },
            query: {
                condition: "and" as const,
                rules: [{ id: "firstName", operation: FilterOperatorTypes.NotEqual, value: "Denied" }]
            }
        };

        const filterResponse = await harness.postFilter(route, query, aclUser([allowed.id]));
        const countResponse = await harness.postFilterCount(route, query, aclUser([allowed.id]));

        expect(filterResponse.status).toBe(200);
        expect(countResponse.status).toBe(200);
        const filterBody = TestHarness.parseFilterBody<{ id: number }>(filterResponse);
        expect(harness.parseCountBody(countResponse)).toBe(filterBody.total);
        expect(TestHarness.mapFilterRowIds(filterBody)).toEqual([allowed.id]);
        expect(TestHarness.mapFilterRowIds(filterBody)).not.toContain(denied.id);
    });
});

describe("access control with download", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("exports only ACL-allowed rows to CSV", async () => {
        await using allowed = await createSeededPerson({
            email: "allowed@example.com",
            first_name: "Allowed",
            last_name: "Export"
        });
        await using _denied = await createSeededPerson({
            email: "denied@example.com",
            first_name: "Denied",
            last_name: "Export"
        });

        const response = await harness.postDownload(
            route,
            "csv",
            {
                page: TestHarness.defaultPage,
                query: {
                    condition: "and",
                    rules: [{ id: "lastName", operation: FilterOperatorTypes.Equal, value: "Export" }]
                }
            },
            aclUser([allowed.id])
        );

        expect(response.status).toBe(200);
        const rows = TestHarness.parseCsv(response.text);
        expect(rows).toEqual([
            ["exports.email", "exports.first_name", "exports.last_name"],
            ["allowed@example.com", "Allowed", "Export"]
        ]);
        expect(rows.some((row) => row.includes("denied@example.com"))).toBe(false);
    });

    it("exports only ACL-allowed rows when search and filter rules are combined", async () => {
        await using allowed = await createSeededPerson({
            email: "alice.special@example.com",
            first_name: "Alice",
            last_name: "Searchable"
        });
        await using _deniedMatch = await createSeededPerson({
            email: "bob.other@example.com",
            first_name: "Alice",
            last_name: "Searchable"
        });
        await using _searchOnly = await createSeededPerson({
            email: "charlie.special@example.com",
            first_name: "Charlie",
            last_name: "Gamma"
        });

        const query = {
            page: TestHarness.defaultPage,
            search: { value: "special" },
            query: {
                condition: "and" as const,
                rules: [{ id: "firstName", operation: FilterOperatorTypes.Equal, value: "Alice" }]
            }
        };

        const filterResponse = await harness.postFilter(route, query, aclUser([allowed.id]));
        const downloadResponse = await harness.postDownload(route, "csv", query, aclUser([allowed.id]));

        expect(filterResponse.status).toBe(200);
        expect(downloadResponse.status).toBe(200);
        expect(TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(filterResponse))).toEqual([
            allowed.id
        ]);

        const rows = TestHarness.parseCsv(downloadResponse.text);
        expect(rows).toEqual([
            ["exports.email", "exports.first_name", "exports.last_name"],
            ["alice.special@example.com", "Alice", "Searchable"]
        ]);
        expect(rows.some((row) => row.includes("bob.other@example.com"))).toBe(false);
        expect(rows.some((row) => row.includes("charlie.special@example.com"))).toBe(false);
    });
});

describe("access control on config routes", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns the same filter config with or without a deserialized user", async () => {
        const withUser = await harness.getFilterConfig(route, aclUser([1]));
        const withoutUser = await harness.getFilterConfig(route);

        expect(withUser.status).toBe(200);
        expect(withoutUser.status).toBe(200);
        expect(
            TestHarness.parseFilterConfig(withUser)
                .map((item) => item.id)
                .sort()
        ).toEqual(
            TestHarness.parseFilterConfig(withoutUser)
                .map((item) => item.id)
                .sort()
        );
    });
});
