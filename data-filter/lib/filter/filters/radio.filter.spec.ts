import { DefaultTranslateAdapter } from "../../adapters/default-translate.adapter";
import { FilterUtils } from "../filter.utils";
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
            filter.translateService = new DefaultTranslateAdapter();
            const config = await filter.getConfig("test", null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Radio,
                operators: [
                    {
                        id: "equal",
                        name: FilterUtils.getOperatorTranslationKey("equal")
                    }
                ],
                options: [
                    {
                        key: "yes",
                        name: FilterUtils.getRadioOptionTranslationKey("test", "yes")
                    },
                    {
                        key: "no",
                        name: FilterUtils.getRadioOptionTranslationKey("test", "no")
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
            filter.translateService = new DefaultTranslateAdapter();
            const config = await filter.getConfig("test", null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Radio,
                operators: [
                    {
                        id: "equal",
                        name: FilterUtils.getOperatorTranslationKey("equal")
                    }
                ],
                group: {
                    name: FilterUtils.getGroupTranslationKey("test"),
                    key: "test"
                },
                options: [
                    {
                        key: "yes",
                        name: FilterUtils.getRadioOptionTranslationKey("test", "yes")
                    },
                    {
                        key: "no",
                        name: FilterUtils.getRadioOptionTranslationKey("test", "no")
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
            filter.translateService = new DefaultTranslateAdapter();
            const config = await filter.getConfig("test", null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Radio,
                operators: [
                    {
                        id: "equal",
                        name: FilterUtils.getOperatorTranslationKey("equal")
                    },
                    {
                        id: "none",
                        name: FilterUtils.getCustomOperatorTranslationKey("test", "none")
                    }
                ],
                options: [
                    {
                        key: "yes",
                        name: FilterUtils.getRadioOptionTranslationKey("test", "yes")
                    },
                    {
                        key: "no",
                        name: FilterUtils.getRadioOptionTranslationKey("test", "no")
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
            filter.translateService = new DefaultTranslateAdapter();
            const config = await filter.getConfig("test", null);
            expect(config).toBeDefined();
            expect(config).toStrictEqual<FilterBaseConfigurationModel>({
                type: FilterType.Radio,
                operators: [
                    {
                        id: "not_equal",
                        name: FilterUtils.getOperatorTranslationKey("not_equal")
                    }
                ],
                options: [
                    {
                        key: "yes",
                        name: FilterUtils.getRadioOptionTranslationKey("test", "yes")
                    },
                    {
                        key: "no",
                        name: FilterUtils.getRadioOptionTranslationKey("test", "no")
                    }
                ]
            });
        });
    });
});
