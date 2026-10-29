import type { Model } from "sequelize";
import { describe, expect, expectTypeOf, it } from "vitest";

import type { AssociationsPropertiesOf } from "./association-properties-of";

interface ProductModel extends Model {
    sku: string;
}

interface CategoryModel extends Model {
    label: string;
    products: ProductModel[];
    featuredProduct: ProductModel;
}

type CategoryAssociationKeys = AssociationsPropertiesOf<CategoryModel>;

describe("associationsPropertiesOf", () => {
    it("includes has-many association keys", () => {
        expect.assertions(0);

        type IncludesProducts = "products" extends CategoryAssociationKeys ? true : false;

        expectTypeOf<IncludesProducts>().toEqualTypeOf<true>();
    });

    it("includes belongs-to association keys", () => {
        expect.assertions(0);

        type IncludesFeaturedProduct = "featuredProduct" extends CategoryAssociationKeys ? true : false;

        expectTypeOf<IncludesFeaturedProduct>().toEqualTypeOf<true>();
    });

    it("excludes scalar model attributes", () => {
        expect.assertions(0);

        type IncludesLabel = "label" extends CategoryAssociationKeys ? true : false;

        expectTypeOf<IncludesLabel>().toEqualTypeOf<false>();
    });
});
