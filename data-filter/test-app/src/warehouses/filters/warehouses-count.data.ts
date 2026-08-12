import { Attributes, Count, Data } from "@recursyve/nestjs-data-filter";
import { Warehouses } from "../models/warehouses.model";

/**
 * @p0 suspected-defect
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
