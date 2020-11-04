import * as mongoose from "mongoose";
import { DataFilterUserModel } from "../../models/user.model";
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

    public async getMatchOptions(rule: QueryRuleModel): Promise<mongoose.FilterQuery<any>> {
        const option = this.options.find(x => x.key === rule.value);
        if (!option) {
            return super.getMatchOptions(rule);
        }

        return super.getMatchOptions({
            ...rule,
            value: option.value,
            operation: option.operator || rule.operation
        });
    }
}
