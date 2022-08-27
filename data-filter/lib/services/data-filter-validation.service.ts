import { Inject, Injectable, Logger, OnModuleInit, Type } from "@nestjs/common";
import { DataFilterService } from "../data-filter.service";
import { VALIDATE_DATA } from "../constant";
import { DataFilterHandler } from "../handlers/data-filter.handler";
import { DatabaseError, ValidationErrorItem } from "sequelize";

@Injectable()
export class DataFilterValidationService implements OnModuleInit {
    private logger = new Logger(DataFilterValidationService.name);

    constructor(@Inject(VALIDATE_DATA) private validateData: boolean, private dataFilterService: DataFilterService) {
    }

    public async onModuleInit(): Promise<void> {
        if (!this.validateData) {
            this.logger.log("Skipped data validation");
            return;
        }

        await this.validateDataTargets();
    }

    private async validateDataTargets(): Promise<void> {
        this.logger.log("Starting data validation");

        await Promise.all(DataFilterHandler.dataTargets.map(dataTarget => this.validateDataTarget(dataTarget)));

        this.logger.log("Completed data validation");
    }

    private async validateDataTarget(dataTarget: Object): Promise<void> {
        try {
            await this.dataFilterService.for(dataTarget as Type).findOne({ logging: false });
        } catch (e) {
            const targetName = (dataTarget as Type).name;

            if (e instanceof DatabaseError || e instanceof ValidationErrorItem) {
                this.logger.error(`Error while validating data '${targetName}': ${e.message}`);
            } else {
                this.logger.error(`Error while validating data '${targetName}': ${e}`)
            }
        }
    }
}
