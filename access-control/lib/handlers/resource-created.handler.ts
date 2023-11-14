import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ResourceCreatedCommand } from "../commands";
import { ResourceCreatedPoliciesService, ResourceAccessService } from "../services";

@CommandHandler(ResourceCreatedCommand)
export class AccessControlResourceCreatedHandler implements ICommandHandler<ResourceCreatedCommand<any>> {
    constructor(
        private resourceCreatedPolicyService: ResourceCreatedPoliciesService,
        private resourceAccessService: ResourceAccessService,
    ) {}

    public async execute(command: ResourceCreatedCommand<any>): Promise<void> {
        const results = await this.resourceCreatedPolicyService.execute(command.resourceName, command.resource);
        if (results) {
            await this.resourceAccessService.addUserResources(results);
        }
    }
}
