import { Attributes, Data, Sum } from "@recursyve/nestjs-data-filter";
import { StockLines } from "../../stock-lines/models/stock-lines.model";
import { Warehouses } from "../models/warehouses.model";

/**
 * @Sum declared on an included property rather than on the data definition.
 * Kept out of AppModule so validateData stays quiet.
 */
@Data(Warehouses)
@Attributes(["code"])
export class WarehousesIncludedSumData {
    @Attributes(["quantity"])
    @Sum("totalQuantity", { attribute: "quantity" })
    lines?: StockLines[];
}
