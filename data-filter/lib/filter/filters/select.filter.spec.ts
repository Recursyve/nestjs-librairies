import { SelectFilter } from "./select.filter";
import { FilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { FilterType } from "../type";
import { FilterOperatorTypes } from "../operators";


describe("SelectFilter", () => {
    describe("getConfig", () => {
        it("should return a valid config", async () => {
            const filter = new SelectFilter({
                attribute: "test",
                values: () => Promise.resolve([{ id: "test", name: "test" }])
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Select,
                operators: [
                    {
                        id: "equal",
                        name: "equal"
                    },
                    {
                        id: "not_equal",
                        name: "not_equal"
                    }
                ],
                values: [],
                lazyLoading: true
            });
        });

        it("with group should return a valid config", async () => {
            const filter = new SelectFilter({
                attribute: "test",
                group: "test",
                values: () => Promise.resolve([{ id: "test", name: "test" }])
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Select,
                operators: [
                    {
                        id: "equal",
                        name: "equal"
                    },
                    {
                        id: "not_equal",
                        name: "not_equal"
                    }
                ],
                group: {
                    name: "test",
                    key: "test"
                },
                values: [],
                lazyLoading: true
            });
        });

        it("with custom operator should return a valid config", async () => {
            const filter = new SelectFilter({
                attribute: "test",
                values: () => Promise.resolve([{ id: "test", name: "test" }])
            }).addOperators({
                name: "none"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Select,
                operators: [
                    {
                        id: "equal",
                        name: "equal"
                    },
                    {
                        id: "not_equal",
                        name: "not_equal"
                    },
                    {
                        id: "none",
                        name: "none"
                    }
                ],
                values: [],
                lazyLoading: true
            });
        });

        it("with specified operators should return a valid config", async () => {
            const filter = new SelectFilter({
                attribute: "test",
                values: () => Promise.resolve([{ id: "test", name: "test" }])
            }).setOperators(FilterOperatorTypes.Equal);
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Select,
                operators: [
                    {
                        id: "equal",
                        name: "equal"
                    }
                ],
                values: [],
                lazyLoading: true
            });
        });

        it("without lazy loading should return a valid config", async () => {
            const filter = new SelectFilter({
                attribute: "test",
                values: () => Promise.resolve([{ id: "test", name: "test" }]),
                lazyLoading: false
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Select,
                operators: [
                    {
                        id: "equal",
                        name: "equal"
                    },
                    {
                        id: "not_equal",
                        name: "not_equal"
                    }
                ],
                values: [{ id: "test", name: "test" }],
                lazyLoading: false
            });
        });
    });
});
