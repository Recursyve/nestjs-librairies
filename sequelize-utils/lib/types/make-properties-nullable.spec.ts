import { describe, expect, expectTypeOf, it } from "vitest";

import type { MakePropertiesNullable } from "./make-properties-nullable";

describe("makePropertiesNullable", () => {
    it("adds null to required properties", () => {
        expect.assertions(0);

        interface Source {
            always: string;
            alreadyNullable: string | null;
        }

        type Result = MakePropertiesNullable<Source>;

        expectTypeOf<Result["always"]>().toEqualTypeOf<string | null>();
    });

    it("preserves properties that were already nullable", () => {
        expect.assertions(0);

        interface Source {
            always: string;
            alreadyNullable: string | null;
        }

        type Result = MakePropertiesNullable<Source>;

        expectTypeOf<Result["alreadyNullable"]>().toEqualTypeOf<string | null>();
    });
});
