import { Attributes, Data, Sum } from "@recursyve/nestjs-data-filter";
import { Warehouses } from "../models/warehouses.model";

/**
 * @p0 suspected-defect
 * @Sum with a nested path — kept out of AppModule so validateData stays quiet.
 * Imported only by sum-attribute characterization tests.
 */
@Data(Warehouses)
@Attributes(["code"])
@Sum("totalQuantity", { attribute: "quantity", path: "lines" })
export class WarehousesSumData {}
