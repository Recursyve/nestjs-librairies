import { Users } from "@recursyve/nestjs-access-control";
import { FindAttributeOptions, Op, WhereOptions } from "sequelize";
import { FilterType } from "../type";
import { GroupFilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { QueryRuleModel } from "../models/query.model";
import { RuleModel } from "../models/rule.model";
import { BaseFilterDefinition, Filter, FilterDefinition } from "./filter";

export interface BaseGroupFilterDefinition {
    rootFilter: Filter;
    group?: string;
    valueFilter?: Filter;
    lazyLoading?: boolean;
    getValueFilter?: (rule: QueryRuleModel) => Promise<BaseFilterDefinition>;
}

export interface GroupFilterDefinition extends BaseGroupFilterDefinition {
    getConfig(key: string, user?: Users): Promise<GroupFilterBaseConfigurationModel>;
    getWhereOptions(rule: QueryRuleModel): Promise<WhereOptions>;
    getHavingOptions(rule: QueryRuleModel): Promise<WhereOptions>;
    getAttributeOptions(rule: QueryRuleModel): Promise<FindAttributeOptions>;
}

export class GroupFilter implements GroupFilterDefinition {
    public type = FilterType.Group;
    public group: string;
    public rootFilter: Filter;
    public valueFilter?: Filter;
    public lazyLoading?: boolean;
    public getValueFilter?: (rule: QueryRuleModel) => Promise<FilterDefinition>;

    public static validate(definition: BaseGroupFilterDefinition) {
        return typeof definition === "object" && definition.rootFilter;
    }

    constructor(definition: BaseGroupFilterDefinition) {
        Object.assign(this, definition);
    }

    public async getConfig(key: string, user?: Users): Promise<GroupFilterBaseConfigurationModel> {
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
                name: this.group
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
        return {
            [Op.and]: [
                await this.rootFilter.getHavingOptions(rule),
                await valueFilter.getHavingOptions(rule)
            ]
        };
    }

    public async getAttributeOptions(rule: QueryRuleModel): Promise<FindAttributeOptions> {
        const [root, value] = this.getRules(rule);
        if (!root || !value) {
            return null;
        }

        const valueFilter = this.valueFilter ?? await this.getValueFilter(root as QueryRuleModel);
        const attributes = [
            ...await this.rootFilter.getAttributeOptions(rule) as string[],
            ...await valueFilter.getAttributeOptions(rule) as string[]
        ].filter(x => x);
        return attributes.length ? attributes : null;
    }

    protected getRules(rule: QueryRuleModel): [RuleModel, RuleModel] {
        const [root, value] = rule.value as [RuleModel, RuleModel];
        if (!root.value || !value.value || !value.operation) {
            return [null, null];
        }

        return [root, value];
    }
}
