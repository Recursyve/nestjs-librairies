import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, DateOnlyFilter } from "@recursyve/nestjs-data-filter";
import { Contracts } from "../models/contracts.model";

@Data(Contracts)
@Attributes(["start_date", "end_date", "total_cost", "payable_by"])
export class ContractsData {}

@Injectable()
export class ContractsFilter extends BaseFilter<ContractsData> {
    public readonly dataDefinition = ContractsData;

    public readonly startDate = new DateOnlyFilter({ attribute: "start_date" });
}
