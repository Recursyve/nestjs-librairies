import { NumberFilter } from "./number.filter";
import { FilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { FilterType } from "../type";
import { FilterOperatorTypes } from "../operators";

describe("NumberFilter", () => {
    describe("getConfig", () => {
        it("should return a valid config", async () => {
            const filter = new NumberFilter({
                attribute: "test"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Number,
                operators: [
                    {
                        "id": "equal",
                        "name": "equal"
                    },
                    {
                        "id": "not_equal",
                        "name": "not_equal"
                    },
                    {
                        "id": "greater",
                        "name": "greater"
                    },
                    {
                        "id": "greater_or_equal",
                        "name": "greater_or_equal"
                    },
                    {
                        "id": "less",
                        "name": "less"
                    },
                    {
                        "id": "less_or_equal",
                        "name": "less_or_equal"
                    }
                ]
            });
        });

        it("with group should return a valid config", async () => {
            const filter = new NumberFilter({
                attribute: "test",
                group: "test"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Number,
                operators: [
                    {
                        "id": "equal",
                        "name": "equal"
                    },
                    {
                        "id": "not_equal",
                        "name": "not_equal"
                    },
                    {
                        "id": "greater",
                        "name": "greater"
                    },
                    {
                        "id": "greater_or_equal",
                        "name": "greater_or_equal"
                    },
                    {
                        "id": "less",
                        "name": "less"
                    },
                    {
                        "id": "less_or_equal",
                        "name": "less_or_equal"
                    }
                ],
                group: {
                    name: "test",
                    key: "test"
                }
            });
        });

        it("with custom operator should return a valid config", async () => {
            const filter = new NumberFilter({
                attribute: "test"
            }).addOperators({
                name: "none"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Number,
                operators: [
                    {
                        "id": "equal",
                        "name": "equal"
                    },
                    {
                        "id": "not_equal",
                        "name": "not_equal"
                    },
                    {
                        "id": "greater",
                        "name": "greater"
                    },
                    {
                        "id": "greater_or_equal",
                        "name": "greater_or_equal"
                    },
                    {
                        "id": "less",
                        "name": "less"
                    },
                    {
                        "id": "less_or_equal",
                        "name": "less_or_equal"
                    },
                    {
                        id: "none",
                        name: "none"
                    }
                ]
            });
        });

        it("with specified operators should return a valid config", async () => {
            const filter = new NumberFilter({
                attribute: "test"
            }).setOperators(FilterOperatorTypes.Equal, FilterOperatorTypes.NotEqual);
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Number,
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
