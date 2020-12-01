import { DynamicModule, Global, Module, Type } from "@nestjs/common";
import { configFactory } from "./config.factory";
import { ConfigTransformerService } from "./services/config-transformer.service";
import { VariableScanner } from "./scanners/variable.scanner";
import { ConfigUtils } from "./config.utils";

@Global()
@Module({
    providers: [
        VariableScanner,
        ConfigTransformerService
    ]
})
export class ConfigModule {
    public static forRoot(...configs: Type<any>[]): DynamicModule {
        return {
            module: ConfigModule,
            providers: configs.map((config) => ({
                provide: ConfigUtils.getProviderToken(config),
                useFactory: configFactory(config),
                inject: [ConfigTransformerService]
            }))
        };
    }
}
