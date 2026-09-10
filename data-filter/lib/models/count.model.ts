import { fn, literal, ProjectionAlias } from "sequelize";
import { Model } from "sequelize-typescript";
import { M, SequelizeUtils } from "../sequelize.utils";
import { CustomAttributesConfig, CustomAttributesOptionConfig } from "./custom-attributes.model";

export interface CountConfig extends CustomAttributesOptionConfig {
    attribute: string;
    distinct?: boolean;
}

export class CountAttributesConfig implements CustomAttributesConfig<CountConfig> {
    public type = "count";

    constructor(public key: string, public config: CountConfig) {}

    public transform(options: object, path?: string, model?: typeof Model): string | ProjectionAlias {
        const fullPath = [path, this.config.path].filter(x => x).join(".");
        const where = this.config.where
            ? SequelizeUtils.generateWhereConditions(this.config.where, options)
            : undefined;
        const condition = SequelizeUtils.hasWhereConditions(where)
            ? SequelizeUtils.whereToSqlCondition(where, fullPath || undefined, model as typeof M | undefined)
            : undefined;
        const attribute = fullPath
            ? SequelizeUtils.getLiteralFullName(this.config.attribute, fullPath)
            : this.config.attribute;
        const counted = condition ? `CASE WHEN ${condition} THEN ${attribute} END` : attribute;

        if (this.config.distinct) {
            return [literal(`COUNT(DISTINCT ${counted})`), this.key];
        }

        if (condition) {
            return [literal(`COUNT(${counted})`), this.key];
        }

        return [fn("COUNT", fullPath ? literal(attribute) : attribute), this.key];
    }

    public shouldGroupBy(): boolean {
        return true;
    }
}
