import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    NumberFilter,
    SearchableAttributes,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { col, fn } from "sequelize";
import { Warehouses } from "../models/warehouses.model";

/**
 * Queryable warehouse listing. @Sum(path) is characterized on WarehousesSumData
 * (imported only by sum-attribute tests) so validateData is not polluted.
 */
@Data(Warehouses)
@Attributes(["code"])
@SearchableAttributes(["code"])
export class WarehousesData {}

@Injectable()
export class WarehousesFilter extends BaseFilter<WarehousesData> {
    public readonly dataDefinition = WarehousesData;

    public readonly code = new TextFilter({ attribute: "code" });

    public readonly minTotalQuantity = new NumberFilter({
        attribute: "id",
        path: "lines",
        group: "lines",
        having: fn("sum", col("lines.quantity"))
    });
}
