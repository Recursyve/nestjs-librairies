import { Type } from "@nestjs/common";
import { DataFilterService } from "../data-filter.service";

export function DataFilterRepositoryFactory<T>(options: { model: T }) {
    return (dataFilterService: DataFilterService) => dataFilterService.for(options.model as Type<T>);
}
