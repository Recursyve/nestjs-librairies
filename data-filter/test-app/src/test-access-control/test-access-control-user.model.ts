import { DataFilterUserModel } from "@recursyve/nestjs-data-filter";

export interface TestAccessControlUser extends DataFilterUserModel {
    allowedPersonIds?: number[];
    language?: string;
    scopeUserId?: string;
}
