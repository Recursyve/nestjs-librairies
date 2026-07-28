import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, DefaultOrderRule, TextFilter } from "@recursyve/nestjs-data-filter";
import { OrderLabRows } from "../models/order-lab-rows.model";

@Data(OrderLabRows)
@Attributes(["code", "label"])
export class OrderLabData {}

@Injectable()
export class OrderLabFilter extends BaseFilter<OrderLabData> {
    public readonly dataDefinition = OrderLabData;

    public readonly defaultOrderRule = new DefaultOrderRule({ column: "id", direction: "asc" });

    public readonly code = new TextFilter({ attribute: "code" });
    public readonly label = new TextFilter({ attribute: "label" });
}
