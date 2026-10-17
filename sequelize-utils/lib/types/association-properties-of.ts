import type { Model } from "sequelize";

export type AssociationsPropertiesOf<T extends Model> = Exclude<
    {
        [P in keyof T]-?: NonNullable<T[P]> extends Model
            ? P
            : NonNullable<T[P]> extends (infer U)[]
              ? U extends Model
                  ? P
                  : never
              : never;
    }[keyof T],
    keyof Model | "version"
>;
