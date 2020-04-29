import { Op, WhereOptions } from "sequelize";
import { DataFilterUserModel } from "../..";
import { TranslateAdapter } from "../../adapters/translate.adapter";
import { FilterUtils } from "../filter.utils";
import { GroupFilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { QueryRuleModel } from "../models/query.model";
import { RuleModel } from "../models/rule.model";
import { FilterType } from "../type";
import { BaseFilterDefinition, Filter, FilterDefinition } from "./filter";

export interface BaseGroupFilterDefinition {
    rootFilter: Filter;
    group?: string;
    valueFilter?: Filter;
    lazyLoading?: boolean;
    getValueFilter?: (rule: QueryRuleModel) => Promise<BaseFilterDefinition>;
}

export interface GroupFilterDefinition extends BaseGroupFilterDefinition {
    getConfig(key: string, user?: DataFilterUserModel): Promise<GroupFilterBaseConfigurationModel>;
    getWhereOptions(rule: QueryRuleModel): Promise<WhereOptions>;
    getHavingOptions(rule: QueryRuleModel): Promise<WhereOptions>;
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

    public async getConfig(key: string, user?: DataFilterUserModel): Promise<GroupFilterBaseConfigurationModel> {
        const config = {
            type: this.type,
            rootFilter: await this.rootFilter.getConfig(key, user),
            lazyLoading: this.lazyLoading ?? false
        } as GroupFilterBaseConfigurationModel;

        if (this.valueFilter) {
            config.valueFilter = await this.valueFilter.getConfig(key, user);
        }
        if (this.group) {
            config.group = {
                key: this.group,
                name: await this._translateService.getTranslation(
                    user?.language,
                    FilterUtils.getGroupTranslationKey(this.group)
                )
            };
        }
        return config;
    }

    public async getWhereOptions(rule: QueryRuleModel, name?: string): Promise<WhereOptions> {
        const [root, value] = this.getRules(rule);
        if (!root || !value) {
            return {};
        }

        const valueFilter = this.valueFilter ?? await this.getValueFilter(root as QueryRuleModel);
        return {
            [Op.and]: [
                await this.rootFilter.getWhereOptions(root as QueryRuleModel),
                await valueFilter.getWhereOptions(value as QueryRuleModel)
            ]
        };
    }

    public async getHavingOptions(rule: QueryRuleModel): Promise<WhereOptions> {
        const [root, value] = this.getRules(rule);
        if (!root || !value) {
            return {};
        }

        const valueFilter = this.valueFilter ?? await this.getValueFilter(root as QueryRuleModel);
        const rootHaving = await this.rootFilter.getHavingOptions(rule);
        const valueHaving = await valueFilter.getHavingOptions(rule);
        if (!rootHaving && !valueHaving) {
            return null;
        }

        return {
            [Op.and]: [
                rootHaving,
                valueHaving
            ].filter(x => x)
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
