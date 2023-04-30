import { Global, Module, OnModuleInit } from "@nestjs/common";
import { Sequelize } from "sequelize-typescript";
import { AfterCreateFormatDateOnlyHook } from "./hooks/after-create-format-date-only.hook";
import { AfterFindFormatDateOnlyHook } from "./hooks/after-find-format-date-only.hook";
import { SequelizeTransactionService } from "./transactions/sequelize-transaction.service";

@Module({})
/** @deprecated Use SequelizeUtilsModule instead */
export class SequelizeUtilsHooksModule implements OnModuleInit {
    constructor(private sequelize: Sequelize) {}

    public onModuleInit(): void {
       this.sequelize.addHook("afterCreate", "transform-date-only", AfterCreateFormatDateOnlyHook);
       this.sequelize.addHook("afterFind", "transform-date-only", AfterFindFormatDateOnlyHook);
    }
}

@Global()
@Module({
    providers: [SequelizeTransactionService],
    exports: [SequelizeTransactionService]
})
export class SequelizeUtilsModule implements OnModuleInit {
    constructor(private sequelize: Sequelize) {}

    public onModuleInit(): void {
        this.sequelize.addHook("afterCreate", "transform-date-only", AfterCreateFormatDateOnlyHook);
        this.sequelize.addHook("afterFind", "transform-date-only", AfterFindFormatDateOnlyHook);
    }
}
