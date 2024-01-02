import { fn, literal } from "sequelize";
import { ProjectionAlias } from "sequelize/types/model";
import { DialectFormatterService } from "../services/dialect-formatter.service";
import {
    CustomAttributesConfig,
    CustomAttributesContext,
    CustomAttributesOptionConfig
} from "./custom-attributes.model";

export interface CountConfig extends CustomAttributesOptionConfig {
    attribute: string;
    distinct?: boolean;
}

export class CountAttributesConfig implements CustomAttributesConfig<CountConfig, CountAttributesContext> {
    public type = "count";

    constructor(public key: string, public config: CountConfig) {}

    public withContext(dialectFormatterService: DialectFormatterService): CountAttributesContext {
        return new CountAttributesContext(this, dialectFormatterService);
    }

    public shouldGroupBy(): boolean {
        return true;
    }
}

export class CountAttributesContext extends CustomAttributesContext {
    constructor(private config: CountAttributesConfig, private dialectFormatterService: DialectFormatterService) {
        super();
    }

    public transform(options: object, path?: string): string | ProjectionAlias {
        if (this.config.config.distinct) {
            const attribute = this.config.config.path
                ? this.dialectFormatterService.getLiteralFullName(this.config.config.attribute, this.config.config.path)
                : this.config.config.attribute;
            return [literal(`COUNT(DISTINCT ${attribute})`), this.config.key];
        }

        const attribute = this.config.config.path
            ? literal(this.dialectFormatterService.getLiteralFullName(this.config.config.attribute, this.config.config.path))
            : this.config.config.attribute;
        return [fn("COUNT", attribute), this.config.key];
    }
}