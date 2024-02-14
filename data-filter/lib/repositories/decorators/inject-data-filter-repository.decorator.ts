import { Inject } from "@nestjs/common";
import { getDataFilterRepositoryToken } from "../get-data-filter-repository.token";

export const InjectDataFilterRepository = <T extends Function>(data: T) => Inject(getDataFilterRepositoryToken(data));
