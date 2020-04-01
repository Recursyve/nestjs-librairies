import { TextFilter } from "./text.filter";
import { FilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { FilterType } from "../type";
import { FilterOperatorTypes } from "../operators";

describe("TextFilter", () => {
    describe("getConfig", () => {
        it("should return a valid config", async () => {
            const filter = new TextFilter({
                attribute: "test"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Text,
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
                        id: "contains",
                        name: "contains"
                    },
                    {
                        id: "begins_with",
                        name: "begins_with"
                    },
                    {
                        id: "not_begins_with",
                        name: "not_begins_with"
                    },
                    {
                        id: "ends_with",
                        name: "ends_with"
                    },
                    {
                        id: "not_ends_with",
                        name: "not_ends_with"
                    }
                ]
            });
        });

        it("with group should return a valid config", async () => {
            const filter = new TextFilter({
                attribute: "test",
                group: "test"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Text,
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
                        id: "contains",
                        name: "contains"
                    },
                    {
                        id: "begins_with",
                        name: "begins_with"
                    },
                    {
                        id: "not_begins_with",
                        name: "not_begins_with"
                    },
                    {
                        id: "ends_with",
                        name: "ends_with"
                    },
                    {
                        id: "not_ends_with",
                        name: "not_ends_with"
                    }
                ],
                group: {
                    name: "test",
                    key: "test"
                }
            });
        });

        it("with custom operator should return a valid config", async () => {
            const filter = new TextFilter({
                attribute: "test"
            }).addOperators({
                name: "none"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Text,
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
                        id: "contains",
                        name: "contains"
                    },
                    {
                        id: "begins_with",
                        name: "begins_with"
                    },
                    {
                        id: "not_begins_with",
                        name: "not_begins_with"
                    },
                    {
                        id: "ends_with",
                        name: "ends_with"
                    },
                    {
                        id: "not_ends_with",
                        name: "not_ends_with"
                    },
                    {
                        id: "none",
                        name: "none"
                    }
                ]
            });
        });

        it("with specified operators should return a valid config", async () => {
            const filter = new TextFilter({
                attribute: "test"
            }).setOperators(FilterOperatorTypes.Equal, FilterOperatorTypes.NotEqual);
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Text,
                operators: [
                    {
                        id: "equal",
                        name: "equal"
                    },
                    {
                        id: "not_equal",
                        name: "not_equal"
                    }
                ]
            });
        });
    });
});
