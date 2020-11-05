import { Body, Get, HttpCode, HttpStatus, Inject, Optional, Post, Query, Req, UseGuards } from "@nestjs/common";
import { FilterQueryModel, FilterResultModel, SelectFilterValue } from "../..";
import { UserDeserializer } from "../../deserializers";
import { DataFilterUserModel } from "../../models/user.model";
import { FilterService } from "../filter.service";
import { FilterQueryGuard } from "../guards/filter-query.guard";
import { FilterConfigurationSearchModel } from "../models/filter-configuration-search.model";
import { FilterConfigurationModel } from "../models/filter-configuration.model";
import { FilterResourceValueModel } from "../models/filter-resource-value.model";

export class FilterController<Data> {
    @Inject()
    @Optional()
    private readonly userUserDeserializer: UserDeserializer<DataFilterUserModel>;

    constructor(protected readonly filterService: FilterService<Data>) {}

    @Post("filter")
    @HttpCode(HttpStatus.OK)
    @UseGuards(FilterQueryGuard)
    public async filter(@Body() query: FilterQueryModel, @Req() req: any): Promise<FilterResultModel<Data>> {
        const user = await this.getUser(req);
        return user ? this.filterService.filter(user, query) : this.filterService.filter(query);
    }

    @Post("filter-count")
    @HttpCode(HttpStatus.OK)
    public async filterCount(@Body() query: FilterQueryModel, @Req() req: any): Promise<number> {
        const user = await this.getUser(req);
        return user ? this.filterService.count(user, query) : this.filterService.count(query);
    }

    @Get("filter/config")
    public async getFilterConfig(@Req() req: any): Promise<FilterConfigurationModel[]> {
        return await this.filterService.getConfig(await this.getUser(req) ?? {} as DataFilterUserModel);
    }

    @Get("filter/config/id")
    public async searchFilterResourceValue(
        @Query() search: FilterResourceValueModel,
        @Req() req: any
    ): Promise<SelectFilterValue> {
        return await this.filterService.findResourceValueById(search, await this.getUser(req) ?? {} as DataFilterUserModel);
    }

    @Get("filter/config/value")
    public async searchFilterConfigValues(
        @Query() search: FilterConfigurationSearchModel,
        @Req() req: any
    ): Promise<SelectFilterValue[]> {
        return await this.filterService.searchConfigValues(search, await this.getUser(req) ?? {} as DataFilterUserModel);
    }

    protected async getUser(req: any): Promise<DataFilterUserModel> {
        if (!this.userUserDeserializer) {
            return null;
        }

        return this.userUserDeserializer.deserializeUser(req);
    }
}
