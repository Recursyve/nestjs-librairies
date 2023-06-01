import { BadRequestException, CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { FILTER_OPTION } from "../../constant";
import { FilterQueryModel } from "../../models/filter.model";
import { FilterOptionConfig } from "../filter.config";

@Injectable()
export class FilterQueryGuard implements CanActivate {
    constructor(@Inject(FILTER_OPTION) private option: FilterOptionConfig) {}

    public canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const body = req.body as FilterQueryModel;
        if (!body) {
            return true;
        }

        if (body?.page?.size > this.option.maxPage) {
            throw new BadRequestException(`Page size should be lower than ${this.option.maxPage}`);
        }

        return true;
    }
}
