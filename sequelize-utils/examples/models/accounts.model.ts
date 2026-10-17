import type { CreationOptional, InferAttributes, InferCreationAttributes } from "sequelize";
import { AllowNull, Column, HasMany } from "sequelize-typescript";

import type { MakePropertiesNullable } from "../../lib";
import { SequelizeEntities } from "../../lib";

type Attributes = MakePropertiesNullable<InferAttributes<Accounts>>;
type CreateAttributes = InferCreationAttributes<Accounts> & {
    firstName: string;
    lastName: string;
    email: string;
};

export class Accounts extends SequelizeEntities<Attributes, CreateAttributes> {
    @AllowNull(false)
    @Column
    public email?: CreationOptional<string>;

    @AllowNull(false)
    @Column
    public firstName?: string;

    @AllowNull(false)
    @Column
    public lastName?: string;

    @Column
    public phone?: string;

    @HasMany(() => Accounts)
    public accounts?: Accounts[];
}
