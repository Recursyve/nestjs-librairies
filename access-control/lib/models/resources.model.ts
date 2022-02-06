import { WhereOptions } from "sequelize";
import { AccessRules } from "./access-rules.model";

export enum PolicyResourceTypes {
    Wildcard = "wildcard",
    Resources = "resources",
    Condition = "condition"
}

export interface PolicyResourcesCondition {
    where: WhereOptions;
    rules: AccessRules;
}

export class PolicyResources {
    public wildcard?: AccessRules;
    public resources?: AccessControlResources[];
    public condition?: PolicyResourcesCondition;

    public get type(): PolicyResourceTypes {
        if (this.wildcard) {
            return PolicyResourceTypes.Wildcard;
        }
        if (this.condition) {
            return PolicyResourceTypes.Condition;
        }

        return PolicyResourceTypes.Resources;
    }

    private constructor({ wildcard, resources, condition }: { wildcard?: AccessRules; resources?: AccessControlResources[]; condition?: PolicyResourcesCondition }) {
        this.wildcard = wildcard;
        this.resources = resources;
        this.condition = condition;
    }

    public static wildcard(rules: AccessRules): PolicyResources {
        return new PolicyResources({ wildcard: rules })
    }

    public static resources(resources: AccessControlResources[]): PolicyResources {
        return new PolicyResources({ resources })
    }

    public static condition(where: WhereOptions, rules: AccessRules): PolicyResources {
        return new PolicyResources({ condition: { where, rules } })
    }
}

export interface AccessControlResources {
    resourceId: number;
    rules: AccessRules;
}

export class Resources {
    public all?: boolean;
    public ids?: number[];
    public where?: WhereOptions;

    private constructor({ all, ids, where }: { all?: boolean; ids?: number[]; where?: WhereOptions }) {
        this.all = all;
        this.ids = ids;
        this.where = where;
    }

    public static all(): Resources {
        return new Resources({ all: true });
    }

    public static fromIds(ids: number[]): Resources {
        return new Resources({ ids });
    }

    public static fromCondition(where: WhereOptions): Resources {
        return new Resources({ where });
    }
}
