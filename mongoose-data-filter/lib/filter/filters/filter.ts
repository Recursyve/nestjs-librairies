import * as mongoose from "mongoose";
import { TranslateAdapter } from "../../adapters";
import { MongoUtils } from "../../mongo.utils";
import { FilterUtils } from "../filter.utils";
import { FilterBaseConfigurationModel, QueryRuleModel } from "../models";
import { FilterOperatorTypes } from "../operators";
import { FilterType } from "../type";
import { RequestInfo } from "../types/request-info.type";

export type Condition = "and" | "or";

export interface BaseFilterDefinition {
    attribute: string;
    path?: string;
    group?: string;

    // Private filters will not be returned to the clients
    private?: boolean;
}

export interface FilterDefinition extends BaseFilterDefinition {
    type: FilterType;
    operators: FilterOperatorTypes[];

    getConfig(key: string, requestInfo: RequestInfo): Promise<FilterBaseConfigurationModel>;

    getMatchOptions(rule: QueryRuleModel): Promise<mongoose.FilterQuery<any>>;
}

export abstract class Filter implements FilterDefinition {
    public type: FilterType;
    public operators: FilterOperatorTypes[];
    public group: string;
    public attribute: string;
    public path?: string;
    public private?: boolean;

    private _type = "filter";

    protected _translateService: TranslateAdapter;

    public set translateService(translateService: TranslateAdapter) {
        this._translateService = translateService;
    }

    protected constructor(definition?: BaseFilterDefinition) {
        if (definition) {
            Object.assign(this, definition);
        }
    }

    public static validate(definition: FilterDefinition) {
        return definition["_type"] === "filter";
    }

    public addOperators(...operator: FilterOperatorTypes[]): Filter {
        this.operators.push(...operator);
        return this;
    }

    public setOperators(...operator: FilterOperatorTypes[]): Filter {
        this.operators = [...operator];
        return this;
    }

    public async getConfig(key: string, requestInfo: RequestInfo): Promise<FilterBaseConfigurationModel> {
        if (this.private) {
            return null;
        }

        const config = {
            type: this.type,
            operators: await Promise.all(
                this.operators.map(async (x) => {
                    return {
                        id: x,
                        name: await this._translateService.getTranslation(
                            requestInfo.user?.language,
                            FilterUtils.getOperatorTranslationKey(x)
                        )
                    };
                })
            )
        } as FilterBaseConfigurationModel;

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
        if (!name) {
            name = this.path ? `${this.path}.${this.attribute}` : this.attribute;
        }

        const value = MongoUtils.generateWhereValue(rule);
        if (value === undefined) {
            return null;
        }

        return {
            [name]: value
        };
    }
}
