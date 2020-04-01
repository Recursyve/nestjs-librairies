export enum AccessActionType {
    Read = "r",
    Update = "u",
    Delete = "d"
}

export type AccessAction = {
    type: AccessActionType;
    resourceIdParameterName: string;
};

export const accessActionTypeValues = Object.values(AccessActionType);

export class AccessRules {
    public r: boolean;
    public u: boolean;
    public d: boolean;

    public static all(): AccessRules {
        return {
            [AccessActionType.Read]: true,
            [AccessActionType.Update]: true,
            [AccessActionType.Delete]: true
        };
    }

    public static readOnly(): AccessRules {
        return {
            [AccessActionType.Read]: true,
            [AccessActionType.Update]: false,
            [AccessActionType.Delete]: false
        };
    }

    public static none(): AccessRules {
        return {
            [AccessActionType.Read]: false,
            [AccessActionType.Update]: false,
            [AccessActionType.Delete]: false
        };
    }

    public static rud(r: boolean, u: boolean, d: boolean): AccessRules {
        return {
            [AccessActionType.Read]: r,
            [AccessActionType.Update]: u,
            [AccessActionType.Delete]: d
        };
    }
}
