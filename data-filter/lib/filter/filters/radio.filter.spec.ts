import { RadioFilter } from "./radio.filter";
import { FilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { FilterType } from "../type";
import { FilterOperatorTypes } from "../operators";


describe("RadioFilter", () => {
    describe("getConfig", () => {
        it("should return a valid config", async () => {
            const filter = new RadioFilter({
                attribute: "test",
                options: [
                    {
                        key: "yes",
                        value: 1
                    },
                    {
                        key: "no",
                        value: 0
                    }
                ]
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Radio,
                operators: [
                    {
                        id: "equal",
                        name: "equal"
                    }
                ],
                options: [
                    {
                        key: "yes",
                        name: "yes"
                    },
                    {
                        key: "no",
                        name: "no"
                    }
                ]
            });
        });

        it("with group should return a valid config", async () => {
            const filter = new RadioFilter({
                attribute: "test",
                group: "test",
                options: [
                    {
                        key: "yes",
                        value: 1
                    },
                    {
                        key: "no",
                        value: 0
                    }
                ]
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Radio,
                operators: [
                    {
                        id: "equal",
                        name: "equal"
                    }
                ],
                group: {
                    name: "test",
                    key: "test"
                },
                options: [
                    {
                        key: "yes",
                        name: "yes"
                    },
                    {
                        key: "no",
                        name: "no"
                    }
                ]
            });
        });

        it("with custom operator should return a valid config", async () => {
            const filter = new RadioFilter({
                attribute: "test",
                options: [
                    {
                        key: "yes",
                        value: 1
                    },
                    {
                        key: "no",
                        value: 0
                    }
                ]
            }).addOperators({
                name: "none"
            });
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Radio,
                operators: [
                    {
                        id: "equal",
                        name: "equal"
                    },
                    {
                        id: "none",
                        name: "none"
                    }
                ],
                options: [
                    {
                        key: "yes",
                        name: "yes"
                    },
                    {
                        key: "no",
                        name: "no"
                    }
                ]
            });
        });

        it("with specified operators should return a valid config", async () => {
            const filter = new RadioFilter({
                attribute: "test",
                options: [
                    {
                        key: "yes",
                        value: 1
                    },
                    {
                        key: "no",
                        value: 0
                    }
                ]
            }).setOperators(FilterOperatorTypes.NotEqual);
            const config = await filter.getConfig(null, null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Radio,
                operators: [
                    {
                        id: "not_equal",
                        name: "not_equal"
                    }
                ],
                options: [
                    {
                        key: "yes",
                        name: "yes"
                    },
                    {
                        key: "no",
                        name: "no"
                    }
                ]
            });
        });
    });
});
