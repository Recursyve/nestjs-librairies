import { describe, expect, expectTypeOf, it } from "vitest";

import type { SequelizeAttributes } from "./sequelize-attributes.model";

describe("sequelizeAttributes", () => {
    it("includes entity metadata fields", () => {
        expect.assertions(0);

        interface CreateAttributes {
            name: string;
        }

        type Attributes = SequelizeAttributes<CreateAttributes>;

        expectTypeOf<Attributes["id"]>().toEqualTypeOf<number>();
    });

    it("makes create attributes optional", () => {
        expect.assertions(0);

        interface CreateAttributes {
            name: string;
            optional?: boolean;
        }

        type Attributes = SequelizeAttributes<CreateAttributes>;

        expectTypeOf<Attributes["name"]>().toEqualTypeOf<string | undefined>();
    });
});
