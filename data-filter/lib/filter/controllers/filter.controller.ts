import { Body, Get, HttpCode, HttpStatus, Post, Query } from "@nestjs/common";
import { FilterQueryModel, FilterResultModel, SelectFilterValue } from "../..";
import { FilterService } from "../filter.service";
import { FilterConfigurationSearchModel } from "../models/filter-configuration-search.model";
import { FilterConfigurationModel } from "../models/filter-configuration.model";
import { FilterResourceValueModel } from "../models/filter-resource-value.model";

export class FilterController<Data> {
    constructor(private readonly filterService: FilterService<Data>) {}

    @Post("filter")
    @HttpCode(HttpStatus.OK)
    public async filter(@Body() query: FilterQueryModel): Promise<FilterResultModel<Data>> {
        return await this.filterService.filter(query);
    }

    @Post("filter-count")
    @HttpCode(HttpStatus.OK)
    public async filterCount(@Body() query: FilterQueryModel): Promise<number> {
        return await this.filterService.count(query);
    }

    @Get("filter/config")
    public async getFilterConfig(): Promise<FilterConfigurationModel[]> {
        return await this.filterService.getConfig();
    }

    @Get("filter/config/id")
    public async searchFilterResourceValue(
        @Query() search: FilterResourceValueModel
    ): Promise<SelectFilterValue> {
        return await this.filterService.findResourceValueById(search);
    }

    @Get("filter/config/value")
    public async searchFilterConfigValues(
        @Query() search: FilterConfigurationSearchModel
    ): Promise<SelectFilterValue[]> {
        return await this.filterService.searchConfigValues(search);
    }
}
