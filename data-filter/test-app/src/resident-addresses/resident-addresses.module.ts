import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { ResidentAddresses } from "./models/resident-addresses.model";

@Module({
    imports: [SequelizeModule.forFeature([ResidentAddresses])]
})
export class ResidentAddressesModule {}
