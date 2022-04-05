import { Op, WhereOptions } from "sequelize";
import { DataFilterUserModel, FilterCondition } from "../..";
import { FilterUtils } from "../filter.utils";
import { QueryRuleModel } from "../models";
import { FilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { FilterOperatorTypes } from "../operators";
import { FilterType } from "../type";
import { BaseFilterDefinition, Filter } from "./filter";

export interface RadioFilterOption {
    key: string;
    value: unknown;
    operator?: FilterOperatorTypes;
    condition?: FilterCondition;
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

    public async getConfig(key: string, user?: DataFilterUserModel): Promise<RadioFilterConfigurationModel> {
        if (this.private) {
            return;
        }

        return {
            ...(await super.getConfig(key, user)),
            options: await Promise.all(this.options.map(async x => ({
                key: x.key,
                name: await this._translateService.getTranslation(
                    user?.language,
                    FilterUtils.getRadioOptionTranslationKey(key, x.key)
                )
            })))
        };
    }

    public async getWhereOptions(rule: QueryRuleModel): Promise<WhereOptions> {
        const option = this.options.find(x => x.key === rule.value);
        if (!option) {
            return super.getWhereOptions(rule);
        }

        if (!option.condition) {
            return super.getWhereOptions({
                ...rule,
                value: option.value,
                operation: option.operator || rule.operation
            });
        }

        const conditions = [];
        const where = option.condition.condition === "and" ? { [Op.and]: conditions } : { [Op.or]: conditions };
        this.generateRuleWhereOptions(option.condition, conditions, rule);
        conditions.push(
            super.getWhereOptions({
                ...rule,
                value: option.value,
                operation: option.operator || rule.operation
            })
        );
        return where;
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
