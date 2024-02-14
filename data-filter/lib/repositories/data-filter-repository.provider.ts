import { Provider } from "@nestjs/common";
import { DataFilterService } from "../data-filter.service";
import { getDataFilterRepositoryToken } from "./get-data-filter-repository.token";
import { DataFilterRepositoryFactory } from "./repository.factory";

export const createDataFilterRepositoryProvider = <T extends Function>(model: T): Provider => ({
    provide: getDataFilterRepositoryToken(model),
    useFactory: DataFilterRepositoryFactory({ model }),
    inject: [DataFilterService],
});
