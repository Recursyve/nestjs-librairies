import { Type } from "@nestjs/common";
import { ConfigTransformerService } from "./services/config-transformer.service";
import { ConfigModel } from "./models/config.model";

export function configFactory(target: Type): any {
    return (configTransformerService: ConfigTransformerService) => {
        return configTransformerService.transform(target);
    };
}
