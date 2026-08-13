import { Attributes, Count, Data } from "@recursyve/nestjs-data-filter";
import { Op } from "sequelize";
import { Warehouses } from "../models/warehouses.model";

/**
 * @Count with a nested path — kept out of AppModule so validateData stays quiet.
 * Exposed through WarehousesCountModule for characterization tests only.
 */
@Data(Warehouses)
@Attributes(["code"])
@Count("lineCount", { attribute: "id", path: "lines" })
export class WarehousesCountData {}

/**
 * @Count on a root-model attribute (no path), so no join is projected alongside
 * the GROUP BY that FilterService adds.
 */
@Data(Warehouses)
@Attributes(["code"])
@Count("selfCount", { attribute: "id" })
export class WarehousesRootCountData {}

@Data(Warehouses)
@Attributes(["code"])
@Count("skuCount", { attribute: "sku", path: "lines", distinct: true })
export class WarehousesDistinctCountData {}

/**
 * The counted path is narrowed by a where built from the runtime conditions
 * passed to the repository.
 */
@Data(Warehouses)
@Attributes(["code"])
@Count("smallLineCount", {
    attribute: "id",
    path: "lines",
    where: { quantity: (options: { minQuantity: number }) => ({ [Op.lt]: options.minQuantity }) }
})
@Count("bigLineCount", {
    attribute: "id",
    path: "lines",
    where: {
        quantity: (options: { minQuantity: number }) => ({ [Op.gte]: options.minQuantity })
    }
})
export class WarehousesWhereCountData {}
