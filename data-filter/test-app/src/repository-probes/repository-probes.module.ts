import { Module } from "@nestjs/common";
import { RepositoryProbesController } from "./controllers/repository-probes.controller";

@Module({
    controllers: [RepositoryProbesController]
})
export class RepositoryProbesModule {}
