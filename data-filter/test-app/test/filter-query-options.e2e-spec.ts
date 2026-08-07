import { FilterOperatorTypes, FilterService, FilterUtils, QueryModel } from "@recursyve/nestjs-data-filter";
import { col, fn, Op, where } from "sequelize";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CatalogItemsFilter } from "../src/catalog-items/filters/catalog-items.filter";
import { ContractSystemsFilter } from "../src/contract-systems/filters/contract-systems.filter";
import { ContractSystems } from "../src/contract-systems/models/contract-systems.model";
import { CoordsFilter } from "../src/coords/filters/coords.filter";
import { CountLabFilter } from "../src/count-lab/filters/count-lab.filter";
import { CountLabParents } from "../src/count-lab/models/count-lab-parents.model";
import { GroupLabFilter } from "../src/group-lab/filters/group-lab.filter";
import { GroupLabEntries } from "../src/group-lab/models/group-lab-entries.model";
import { MarketListingsFilter } from "../src/market-listings/filters/market-listings.filter";
import { MemberTiersFilter } from "../src/member-tiers/filters/member-tiers.filter";
import { EditionsFilter } from "../src/editions/filters/editions.filter";
import { OrderLabFilter } from "../src/order-lab/filters/order-lab.filter";
import { PersonsFilter } from "../src/persons/filters/persons.filter";
import { TenantScopesFilter } from "../src/tenant-scopes/filters/tenant-scopes.filter";
import { TenantScopes } from "../src/tenant-scopes/models/tenant-scopes.model";
import { TestHarness } from "./harness/test-harness";

type FilterServiceInternals = {
    addDefaultFilter: (query?: QueryModel) => QueryModel | undefined;
    getAccessControlWhereCondition: (where: unknown, user: unknown) => Promise<unknown>;
    getNonNestedOrderColumns: (orders: Array<{ column: string; direction: string }>) => string[];
    getOrderOptions: (
        orders: Array<{ column: string; direction: string; nullLast?: boolean }>,
        context: { request: unknown; user: null }
    ) => unknown;
    getOrderCustomAttribute: (
        orders: Array<{ column: string; direction: string; nullLast?: boolean }>,
        data?: object
    ) => unknown;
    getOrderSelectAttributes: (
        orders: Array<{ column: string; direction: string; nullLast?: boolean }>,
        context: { request: unknown; user: null },
        data?: object
    ) => unknown;
};

function literalValue(entry: unknown): string | undefined {
    if (!entry || typeof entry !== "object") {
        return undefined;
    }

    const candidate = entry as { val?: string };
    return typeof candidate.val === "string" ? candidate.val : undefined;
}

describe("filter query options from getFindOptions", () => {
    let harness: TestHarness;
    let contractSystemsService: FilterService<unknown>;

    beforeAll(async () => {
        harness = await TestHarness.create();
        contractSystemsService = harness.app.get<FilterService<unknown>>(
            FilterUtils.getProviderToken(ContractSystemsFilter)
        );
    });

    afterAll(async () => {
        await harness.close();
    });

    it("builds having, condition includes, and nested where options for contract-systems", async () => {
        const options = await contractSystemsService.getFindOptions(
            ContractSystems,
            {
                condition: "and",
                rules: [
                    {
                        id: "ownerEmail",
                        value: null,
                        operation: "none"
                    },
                    {
                        id: "ownerFirstName",
                        value: "John",
                        operation: FilterOperatorTypes.Equal
                    },
                    {
                        id: "visitCount",
                        value: 2,
                        operation: FilterOperatorTypes.GreaterOrEqual
                    }
                ]
            },
            {},
            null
        );

        expect(options.having).toEqual({
            [Op.and]: [
                where(fn("count", col("system.place.owners.person.email")), {
                    [Op.lte]: 0
                }),
                where(fn("count", col("visits.visit.id")), {
                    [Op.gte]: 2
                })
            ]
        });
        expect(options.where).toEqual({
            [Op.and]: [
                {
                    [Op.and]: [
                        {
                            "$system.place.owners.person.first_name$": "John"
                        },
                        {
                            "$system.place.owners.person.last_name$": "Alpha"
                        }
                    ]
                }
            ]
        });
        expect(options.include).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ as: "visits" }),
                expect.objectContaining({ as: "system" })
            ])
        );
    });

    it("resolves filter where callbacks when a path is configured", async () => {
        const options = await contractSystemsService.getFindOptions(
            ContractSystems,
            {
                condition: "and",
                rules: [
                    {
                        id: "scopedContractCost",
                        value: "1000",
                        operation: FilterOperatorTypes.Equal
                    }
                ]
            },
            { minCost: 500 },
            null
        );

        expect(options.include).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    as: "contract",
                    where: {
                        total_cost: 500
                    }
                })
            ])
        );
    });

    it("applies implicit category conditions from filter definitions", async () => {
        const tenantScopesService = harness.app.get<FilterService<unknown>>(
            FilterUtils.getProviderToken(TenantScopesFilter)
        );

        const options = await tenantScopesService.getFindOptions(
            TenantScopes,
            {
                condition: "and",
                rules: [
                    {
                        id: "categoryScoped",
                        value: "Scoped label",
                        operation: FilterOperatorTypes.Equal
                    }
                ]
            },
            {},
            null
        );

        expect(options.where).toEqual({
            [Op.and]: [
                {
                    [Op.and]: [
                        {
                            label: "Scoped label"
                        },
                        {
                            tenant_id: 7
                        }
                    ]
                }
            ]
        });
    });

    it("builds having options for count-lab child totals", async () => {
        const countLabService = harness.app.get<FilterService<unknown>>(FilterUtils.getProviderToken(CountLabFilter));

        const options = await countLabService.getFindOptions(
            CountLabParents,
            {
                condition: "and",
                rules: [
                    {
                        id: "minChildren",
                        value: 2,
                        operation: FilterOperatorTypes.GreaterOrEqual
                    }
                ]
            },
            {},
            null
        );

        expect(options.having).toEqual({
            [Op.and]: [
                where(fn("count", col("children.id")), {
                    [Op.gte]: 2
                })
            ]
        });
        expect(options.include).toEqual(expect.arrayContaining([expect.objectContaining({ as: "children" })]));
    });

    it("includes eager value filters but not lazy value filters in group definitions", async () => {
        const groupLabService = harness.app.get<FilterService<unknown>>(FilterUtils.getProviderToken(GroupLabFilter));

        const eagerOptions = await groupLabService.getFindOptions(
            GroupLabEntries,
            {
                condition: "and",
                rules: [
                    {
                        id: "eagerStatusScoreGroup",
                        operation: FilterOperatorTypes.Equal,
                        value: [
                            { operation: FilterOperatorTypes.Equal, value: "open" },
                            { operation: FilterOperatorTypes.Greater, value: 10 }
                        ]
                    }
                ]
            },
            {},
            null
        );
        const lazyOptions = await groupLabService.getFindOptions(
            GroupLabEntries,
            {
                condition: "and",
                rules: [
                    {
                        id: "lazyTierScoreGroup",
                        operation: FilterOperatorTypes.Equal,
                        value: [
                            { operation: FilterOperatorTypes.Equal, value: "gold" },
                            { operation: FilterOperatorTypes.Greater, value: 10 }
                        ]
                    }
                ]
            },
            {},
            null
        );

        expect(eagerOptions.where).toEqual({
            [Op.and]: [
                {
                    [Op.and]: [{ status: "open" }, { score: { [Op.gt]: 10 } }]
                }
            ]
        });
        expect(lazyOptions.where).toEqual({
            [Op.and]: [
                {
                    [Op.and]: [{ tier: "gold" }, { score: { [Op.gt]: 10 } }]
                }
            ]
        });
        expect(eagerOptions.include).toEqual(lazyOptions.include);
    });
});

describe("filter order and default filter helpers", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("deduplicates default id ordering when explicit id desc is requested", () => {
        const orderLabService = harness.app.get<FilterService<unknown>>(
            FilterUtils.getProviderToken(OrderLabFilter)
        ) as unknown as FilterServiceInternals;
        const order = orderLabService.getOrderOptions([{ column: "id", direction: "desc" }], {
            request: {},
            user: null
        }) as unknown[];

        expect(order).toHaveLength(1);
        expect(literalValue(order[0])).toContain("DESC");
        expect(literalValue(order[0])).not.toContain("ASC");
    });

    it("flips custom attribute distance ordering when nullLast is enabled", () => {
        const coordsService = harness.app.get<FilterService<unknown>>(
            FilterUtils.getProviderToken(CoordsFilter)
        ) as unknown as FilterServiceInternals;

        const asc = coordsService.getOrderOptions([{ column: "distance", direction: "asc" }], {
            request: {},
            user: null
        }) as Array<[unknown, string]>;
        const nullLast = coordsService.getOrderOptions([{ column: "distance", direction: "asc", nullLast: true }], {
            request: {},
            user: null
        }) as Array<[unknown, string]>;

        expect(literalValue(asc[0]?.[0])).toBe("distance");
        expect(asc[0]?.[1]).toBe("ASC");
        expect(literalValue(nullLast[0]?.[0])).toBe("-distance");
        expect(nullLast[0]?.[1]).toBe("DESC");
    });

    it("projects custom attribute aliases used for distance ordering", () => {
        const coordsService = harness.app.get<FilterService<unknown>>(
            FilterUtils.getProviderToken(CoordsFilter)
        ) as unknown as FilterServiceInternals;

        const attributes = coordsService.getOrderCustomAttribute([{ column: "distance", direction: "asc" }], {
            coordinates: [45.5017, -73.5673]
        }) as Array<[unknown, string]>;

        expect(attributes).toHaveLength(1);
        expect(attributes[0]?.[1]).toBe("distance");
    });

    it("builds EnumOrderRule order literals for persons statusOrder", () => {
        const personsService = harness.app.get<FilterService<unknown>>(
            FilterUtils.getProviderToken(PersonsFilter)
        ) as unknown as FilterServiceInternals;

        const order = personsService.getOrderOptions([{ column: "statusOrder", direction: "asc" }], {
            request: {},
            user: null
        }) as Array<[unknown, string]>;

        expect(literalValue(order[0]?.[0])).toContain("CASE `Persons`.`last_name`");
        expect(literalValue(order[0]?.[0])).toContain("WHEN 'Alpha' THEN 3");
        expect(order[0]?.[1]).toBe("ASC");
    });

    it("projects model columns and order rules used in DISTINCT id pagination", () => {
        const personsService = harness.app.get<FilterService<unknown>>(
            FilterUtils.getProviderToken(PersonsFilter)
        ) as unknown as FilterServiceInternals;

        const attributes = personsService.getOrderSelectAttributes(
            [{ column: "first_name", direction: "asc" }],
            { request: {}, user: null }
        ) as Array<[unknown, string]>;

        expect(attributes).toHaveLength(1);
        expect(literalValue(attributes[0]?.[0])).toBe("`Persons`.`first_name`");
        expect(attributes[0]?.[1]).toBe("first_name");
    });

    it("includes defaultOrderRule columns in order select attributes", () => {
        const editionsService = harness.app.get<FilterService<unknown>>(
            FilterUtils.getProviderToken(EditionsFilter)
        ) as unknown as FilterServiceInternals;

        const attributes = editionsService.getOrderSelectAttributes([], { request: {}, user: null }) as Array<
            [unknown, string]
        >;

        expect(attributes).toHaveLength(1);
        expect(literalValue(attributes[0]?.[0])).toBe("`Editions`.`code`");
        expect(attributes[0]?.[1]).toBe("code");
    });

    it("wraps required default filters in AND when the incoming query uses OR", () => {
        const catalogService = harness.app.get<FilterService<unknown>>(
            FilterUtils.getProviderToken(CatalogItemsFilter)
        ) as unknown as FilterServiceInternals;

        const wrapped = catalogService.addDefaultFilter({
            condition: "or",
            rules: [{ id: "status", operation: FilterOperatorTypes.Equal, value: "draft" }]
        });

        expect(wrapped?.condition).toBe("and");
        expect(wrapped?.rules).toHaveLength(2);
    });

    it("wraps optional default filters in OR when the incoming query uses AND", () => {
        const marketListingsService = harness.app.get<FilterService<unknown>>(
            FilterUtils.getProviderToken(MarketListingsFilter)
        ) as unknown as FilterServiceInternals;

        const wrapped = marketListingsService.addDefaultFilter({
            condition: "and",
            rules: [{ id: "visibility", operation: FilterOperatorTypes.Equal, value: "private" }]
        });

        expect(wrapped?.condition).toBe("or");
        expect(wrapped?.rules).toHaveLength(2);
    });

    it("throws when access control is enabled without a user", async () => {
        const coordsService = harness.app.get<FilterService<unknown>>(
            FilterUtils.getProviderToken(CoordsFilter)
        ) as unknown as FilterServiceInternals;

        await expect(coordsService.getAccessControlWhereCondition({}, null)).rejects.toThrow("No user found");
    });

    it("returns only top-level columns from getNonNestedOrderColumns", () => {
        const coordsService = harness.app.get<FilterService<unknown>>(
            FilterUtils.getProviderToken(CoordsFilter)
        ) as unknown as FilterServiceInternals;

        expect(
            coordsService.getNonNestedOrderColumns([
                { column: "id", direction: "asc" },
                { column: "coord.location.value", direction: "asc" },
                { column: "", direction: "asc" }
            ])
        ).toEqual(["id"]);
    });

    it("resolves select resources and search config values through public service methods", async () => {
        const memberTiersService = harness.app.get<FilterService<unknown>>(
            FilterUtils.getProviderToken(MemberTiersFilter)
        );

        const resource = await memberTiersService.findResourceValueById(
            {},
            { id: "tierSelect", resourceId: "gold" },
            undefined
        );
        const unknownResource = await memberTiersService.findResourceValueById(
            {},
            { id: "missing-select", resourceId: "gold" },
            undefined
        );
        const values = await memberTiersService.searchConfigValues(
            {},
            { id: "tierSelect", value: "", page: 0, pageSize: 2 },
            undefined
        );

        expect(resource).toEqual({ id: "gold", name: "Gold" });
        expect(unknownResource).toBeNull();
        expect(values).toEqual([
            { id: "bronze", name: "Bronze" },
            { id: "silver", name: "Silver" }
        ]);
    });
});
