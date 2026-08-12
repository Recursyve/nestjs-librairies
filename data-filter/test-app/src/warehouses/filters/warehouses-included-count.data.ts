import { Attributes, Count, Data, Include } from "@recursyve/nestjs-data-filter";
import { StockLines } from "../../stock-lines/models/stock-lines.model";
import { Warehouses } from "../models/warehouses.model";

/**
 * @Count declared on an included property rather than on the data definition.
 * Kept out of AppModule so validateData stays quiet.
 */
@Data(Warehouses)
@Attributes(["code"])
export class WarehousesIncludedCountData {
    @Attributes(["sku"])
    @Count("lineCount", { attribute: "id" })
    lines?: StockLines[];
}

/**
 * @Count whose path is relative to the property it is declared on, so the
 * counted column must resolve to the nested include alias (`lines->warehouse`).
 */
@Data(Warehouses)
@Attributes(["code"])
export class WarehousesNestedPathCountData {
    @Attributes(["sku"])
    @Include("warehouse")
    @Count("ownerCount", { attribute: "id", path: "warehouse" })
    lines?: StockLines[];
}
