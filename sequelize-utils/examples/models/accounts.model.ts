import { AllowNull, Column, HasMany, } from "sequelize-typescript";
import { SequelizeEntities } from "../../lib";
import { SequelizeAttributes } from "../../lib/models/sequelize-attributes.model";

export interface CreateAccountsAttributes {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
}

export interface AccountsAttributes extends SequelizeAttributes<CreateAccountsAttributes> {}

export class Accounts extends SequelizeEntities<AccountsAttributes, CreateAccountsAttributes> {
    @AllowNull(false)
    @Column
    email?: string;

    @AllowNull(false)
    @Column
    firstName?: string;

    @AllowNull(false)
    @Column
    lastName?: string;

    @Column
    phone?: string;

    @HasMany(() => Accounts)
    accounts?: Accounts[];
}