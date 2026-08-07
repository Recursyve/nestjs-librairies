import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { StockLines } from "./models/stock-lines.model";

@Module({
    imports: [SequelizeModule.forFeature([StockLines])]
})
export class StockLinesModule {}
