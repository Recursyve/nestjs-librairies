import { Injectable } from "@nestjs/common";
import { BaseFilter, TextFilter } from "@recursyve/nestjs-data-filter";
import { WarehousesCountData, WarehousesRootCountData } from "./warehouses-count.data";

@Injectable()
export class WarehousesCountFilter extends BaseFilter<WarehousesCountData> {
    public readonly dataDefinition = WarehousesCountData;

    public readonly code = new TextFilter({ attribute: "code" });
}

@Injectable()
export class WarehousesRootCountFilter extends BaseFilter<WarehousesRootCountData> {
    public readonly dataDefinition = WarehousesRootCountData;

    public readonly code = new TextFilter({ attribute: "code" });
}
