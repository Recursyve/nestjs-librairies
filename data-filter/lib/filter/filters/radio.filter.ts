import { BaseFilterDefinition, Filter } from "./filter";
import { FilterType } from "../type";
import { FilterOperatorTypes } from "../operators";
import { QueryRuleModel } from "../models";
import { WhereOptions } from "sequelize";
import { FilterBaseConfigurationModel } from "../models/filter-configuration.model";

export interface RadioFilterOption {
    key: string;
    value: unknown;
    operator?: FilterOperatorTypes;
}

export interface RadioFilterDefinition {
    options: RadioFilterOption[];
}

export interface RadioFilterOptionConfiguration {
    key: string;
    name?: string;
}

export interface RadioFilterConfigurationModel extends FilterBaseConfigurationModel {
    options: RadioFilterOptionConfiguration[];
}

export class RadioFilter extends Filter implements RadioFilterDefinition {
    public type = FilterType.Radio;
    public operators = [FilterOperatorTypes.Equal];
    public options: RadioFilterOption[];

    constructor(definition: BaseFilterDefinition & RadioFilterDefinition) {
        super(definition);
    }

    public async getConfig<Users>(key: string, user?: Users): Promise<RadioFilterConfigurationModel> {
        return {
            ...(await super.getConfig(key, user)),
            options: this.options.map(x => ({
                key: x.key,
                name: x.key
            }))
        };
    }

    public async getWhereOptions(rule: QueryRuleModel): Promise<WhereOptions> {
        const option = this.options.find(x => x.key === rule.value);
        if (!option) {
            return super.getWhereOptions(rule);
        }

        return super.getWhereOptions({
            ...rule,
            value: option.value,
            operation: option.operator ?? rule.operation
        });
    }

    public async getHavingOptions(rule: QueryRuleModel): Promise<WhereOptions> {
        const option = this.options.find(x => x.key === rule.value);
        if (!option) {
            return super.getHavingOptions(rule);
        }

        return super.getHavingOptions({
            ...rule,
            value: option.value,
            operation: option.operator ?? rule.operation
        });
    }
}
