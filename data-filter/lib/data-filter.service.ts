import { Injectable, Type } from "@nestjs/common";
import { DataFilterRepository } from "./data-filter.repository";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { SequelizeModelScanner } from "./scanners/sequelize-model.scanner";

@Injectable()
export class DataFilterService {
    constructor(
        private dataFilterScanner: DataFilterScanner,
        private sequelizeModelScanner: SequelizeModelScanner
    ) {}

    public for<T>(data: Type<T>): DataFilterRepository<T> {
        return new DataFilterRepository<T>(
            data,
            this.dataFilterScanner,
            this.sequelizeModelScanner
        );
    }
}
