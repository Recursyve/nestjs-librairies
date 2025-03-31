import {
    Body,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Optional,
    Param,
    Post,
    Query,
    Req,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import { ExportTypes, FilterQueryModel, FilterResultModel, SelectFilterValue } from "../..";
import { FILTER_OPTION } from "../../constant";
import { UserDeserializer } from "../../deserializers";
import { DataFilterUserModel } from "../../models/user.model";
import { FilterOptionConfig } from "../filter.config";
import { FilterService } from "../filter.service";
import { FilterQueryGuard } from "../guards/filter-query.guard";
import { DataFileDownloadInterceptor } from "../interceptors/data-file-download.interceptor";
import { FilterConfigurationSearchModel } from "../models/filter-configuration-search.model";
import { FilterConfigurationModel } from "../models/filter-configuration.model";
import { FilterResourceValueModel } from "../models/filter-resource-value.model";

export class FilterController<Data> {
    @Inject()
    @Optional()
    private readonly userUserDeserializer!: UserDeserializer<DataFilterUserModel>;

    @Inject(FILTER_OPTION)
    private readonly option!: FilterOptionConfig;

    constructor(protected readonly filterService: FilterService<Data>) {}

    @Post("filter")
    @HttpCode(HttpStatus.OK)
    @UseGuards(FilterQueryGuard)
    public async filter(@Body() query: FilterQueryModel, @Req() request: any): Promise<FilterResultModel<Data>> {
        const user = await this.getUser(request);
        return this.filterService.filter({ options: query, request, user });
    }

    @Post("filter-count")
    @HttpCode(HttpStatus.OK)
    public async filterCount(@Body() query: FilterQueryModel, @Req() request: any): Promise<number> {
        const user = await this.getUser(request);
        return this.filterService.count({ options: query, user });
    }

    @Post("download/:type")
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(DataFileDownloadInterceptor)
    public async downloadData(
        @Body() query: FilterQueryModel,
        @Param("type") type: ExportTypes,
        @Req() request: any
    ): Promise<Buffer | string> {
        const user = await this.getUser(request);
        return await this.filterService.downloadData({ options: query, request, type, user });
    }

    @Get("filter/config")
    public async getFilterConfig(@Req() request: any): Promise<FilterConfigurationModel[]> {
        return await this.filterService.getConfig(request, await this.getUser(request) ?? {} as DataFilterUserModel);
    }

    @Get("filter/config/id")
    public async searchFilterResourceValue(
        @Query() search: FilterResourceValueModel,
        @Req() request: any
    ): Promise<SelectFilterValue | null> {
        return await this.filterService.findResourceValueById(request, search, await this.getUser(request) ?? {} as DataFilterUserModel);
    }

    @Get("filter/config/value")
    public async searchFilterConfigValues(
        @Query() search: FilterConfigurationSearchModel,
        @Req() request: any
    ): Promise<SelectFilterValue[]> {
        return await this.filterService.searchConfigValues(request, search, await this.getUser(request) ?? {} as DataFilterUserModel);
    }

    protected async getUser(request: any): Promise<DataFilterUserModel | null> {
        if (!this.userUserDeserializer || this.option.disableAccessControl) {
            return null;
        }

        return this.userUserDeserializer.deserializeUser(request);
    }
}
