import * as mongoose from "mongoose";
import { TranslateAdapter } from "../../adapters/translate.adapter";
import { DataFilterUserModel } from "../../models/user.model";
import { FilterUtils } from "../filter.utils";
import { GroupFilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { QueryRuleModel } from "../models/query.model";
import { RuleModel } from "../models/rule.model";
import { FilterType } from "../type";
import { BaseFilterDefinition, Filter, FilterDefinition } from "./filter";
import { RequestInfo } from "../types/request-info.type";

export interface BaseGroupFilterDefinition {
    rootFilter: Filter;
    group?: string;
    valueFilter?: Filter;
    lazyLoading?: boolean;
    getValueFilter?: (rule: QueryRuleModel) => Promise<BaseFilterDefinition>;
}

export interface GroupFilterDefinition extends BaseGroupFilterDefinition {
    getConfig(key: string, requestInfo: RequestInfo): Promise<GroupFilterBaseConfigurationModel>;
    getMatchOptions(rule: QueryRuleModel, name?: string): Promise<mongoose.FilterQuery<any>>;
}

export class GroupFilter implements GroupFilterDefinition {
    private _type = "group_filter";
    protected _translateService: TranslateAdapter;

    public set translateService(translateService: TranslateAdapter) {
        this._translateService = translateService;

        this.rootFilter.translateService = translateService;
        if (this.valueFilter) {
            this.valueFilter.translateService = translateService;
        }
    }

    public type = FilterType.Group;
    public group: string;
    public rootFilter: Filter;
    public valueFilter?: Filter;
    public lazyLoading?: boolean;
    public getValueFilter?: (rule: QueryRuleModel) => Promise<FilterDefinition>;

    constructor(definition: BaseGroupFilterDefinition) {
        Object.assign(this, definition);
    }

    public static validate(definition: BaseGroupFilterDefinition) {
        return definition["_type"] === "group_filter";
    }

    public async getConfig(key: string, requestInfo?: RequestInfo): Promise<GroupFilterBaseConfigurationModel> {
        const config = {
            type: this.type,
            rootFilter: await this.rootFilter.getConfig(key, requestInfo),
            lazyLoading: this.lazyLoading ?? false
        } as GroupFilterBaseConfigurationModel;

        if (this.valueFilter) {
            config.valueFilter = await this.valueFilter.getConfig(key, requestInfo);
        }
        if (this.group) {
            config.group = {
                key: this.group,
                name: await this._translateService.getTranslation(
                    requestInfo.user?.language,
                    FilterUtils.getGroupTranslationKey(this.group)
                )
            };
        }
        return config;
    }

    public async getMatchOptions(rule: QueryRuleModel, name?: string): Promise<mongoose.FilterQuery<any>> {
        const [root, value] = this.getRules(rule);
        if (!root || !value) {
            return {};
        }

        const valueFilter = this.valueFilter ?? await this.getValueFilter(root as QueryRuleModel);
        return {
            $and: [
                await this.rootFilter.getMatchOptions(root as QueryRuleModel),
                await valueFilter.getMatchOptions(value as QueryRuleModel)
            ]
        };
    }

    protected getRules(rule: QueryRuleModel): [RuleModel, RuleModel] {
        const [root, value] = rule.value as [RuleModel, RuleModel];
        if (!root.value || !value.value || !value.operation) {
            return [null, null];
        }

        return [root, value];
    }
}
