import { Injectable } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { M } from "../sequelize.utils";

@Injectable()
export class DialectFormatterService {
    constructor(private sequelize: Sequelize) {}

    public formatCol(model: string, column: string): string {
        const dialect = this.sequelize.getDialect();
        if (dialect === "mssql") {
            return `[${model}].[${column}]`;
        }

        return `\`${model}\`.\`${column}\``;
    }

    public getGroupLiteral(model: typeof M, group: string): string {
        const items = group.split(".");
        if (items.length > 1) {
            const column = items[items.length - 1];
            return this.getLiteralFullName(column, items.slice(0, items.length - 1));
        }

        return this.formatCol(model.name, group);
    }

    public getOrderFullName(attribute: string, path: string[]) {
        const dialect = this.sequelize.getDialect();
        if (dialect === "mssql") {
            return `[${path.join("->")}].[${attribute}]`;
        }

        return `${path.join("->")}.${attribute}`;
    }

    public getLiteralFullName(attribute: string, path: string | string[]) {
        if (typeof path === "string") {
            path = path.split(".");
        }

        const dialect = this.sequelize.getDialect();
        if (dialect === "mssql") {
            return `[${path.join("->")}].[${attribute}]`;
        }

        return `\`${path.join("->")}\`.\`${attribute}\``;
    }
}
