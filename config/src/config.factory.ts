import { Type } from "@nestjs/common";
import { ConfigTransformerService } from "./services/config-transformer.service";

export function configFactory(config: Type): any {
    return (configTransformerService: ConfigTransformerService) => {
        return configTransformerService.transform(config);
    };
}
