import { fn, literal, ProjectionAlias } from "sequelize";
import { DialectFormatterService } from "../services/dialect-formatter.service";
import {
    CustomAttributesConfig,
    CustomAttributesContext,
    CustomAttributesOptionConfig
} from "./custom-attributes.model";

export interface SumConfig extends CustomAttributesOptionConfig {
    attribute: string;
}

export class SumAttributesConfig implements CustomAttributesConfig<SumConfig, SumAttributesContext> {
    public type = "sum";

    constructor(public key: string, public config: SumConfig) {}

    public withContext(dialectFormatterService: DialectFormatterService): SumAttributesContext {
        return new SumAttributesContext(this, dialectFormatterService);
    }

    public shouldGroupBy(): boolean {
        return true;
    }
}

export class SumAttributesContext extends CustomAttributesContext {
    constructor(private config: SumAttributesConfig, private dialectFormatterService: DialectFormatterService) {
        super();
    }

    public transform(options: object, path?: string): string | ProjectionAlias {
        const attribute = this.config.config.path
            ? literal(this.dialectFormatterService.getLiteralFullName(this.config.config.attribute, this.config.config.path))
            : this.config.config.attribute;
        return [fn("SUM", attribute), this.config.key];
    }
}