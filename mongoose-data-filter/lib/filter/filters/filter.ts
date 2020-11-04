import * as mongoose from "mongoose";
import { TranslateAdapter } from "../../adapters";
import { DataFilterUserModel } from "../../models/user.model";
import { MongoUtils } from "../../mongo.utils";
import { FilterUtils } from "../filter.utils";
import { FilterBaseConfigurationModel, QueryRuleModel } from "../models";
import { FilterOperatorTypes } from "../operators";
import { FilterType } from "../type";

export type Condition = "and" | "or";

export interface BaseFilterDefinition {
    attribute: string;
    path?: string;
    group?: string;
}

export interface FilterDefinition extends BaseFilterDefinition {
    type: FilterType;
    operators: (FilterOperatorTypes)[];

    getConfig(key: string, user?: DataFilterUserModel): Promise<FilterBaseConfigurationModel>;
    getMatchOptions(rule: QueryRuleModel): Promise<mongoose.FilterQuery<any>>;
}

export abstract class Filter implements FilterDefinition {
    private _type = "filter";

    protected _translateService: TranslateAdapter;

    public set translateService(translateService: TranslateAdapter) {
        this._translateService = translateService;
    }

    public type: FilterType;
    public operators: (FilterOperatorTypes)[];
    public group: string;
    public attribute: string;
    public path?: string;

    public static validate(definition: FilterDefinition) {
        return definition["_type"] === "filter";
    }

    protected constructor(definition?: BaseFilterDefinition) {
        if (definition) {
            Object.assign(this, definition);
        }
    }

    public addOperators(...operator: (FilterOperatorTypes)[]): Filter {
        this.operators.push(...operator);
        return this;
    }

    public setOperators(...operator: (FilterOperatorTypes)[]): Filter {
        this.operators = [...operator];
        return this;
    }

    public async getConfig(key: string, user?: DataFilterUserModel): Promise<FilterBaseConfigurationModel> {
        const config = {
            type: this.type,
            operators: await Promise.all(this.operators.map(async x => {
                return {
                    id: x,
                    name: await this._translateService.getTranslation(
                        user?.language,
                        FilterUtils.getOperatorTranslationKey(x)
                    )
                };
            }))
        } as FilterBaseConfigurationModel;

        if (this.group) {
            config.group = {
                key: this.group,
                name: await this._translateService.getTranslation(user?.language, FilterUtils.getGroupTranslationKey(this.group))
            }
        }
        return config;
    }

    public async getMatchOptions(rule: QueryRuleModel, name?: string): Promise<mongoose.FilterQuery<any>> {
        if (!name) {
            name = this.path ? `${this.path}.${this.attribute}` : this.attribute;
        }

        const value = MongoUtils.generateWhereValue(rule);
        if (value === undefined) {
            return null;
        }

        return {
            [name]: value
        }
    }
}
