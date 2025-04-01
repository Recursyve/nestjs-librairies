import {
    Type,
    Post,
    HttpCode,
    HttpStatus,
    UseGuards,
    UseInterceptors,
    Body,
    Get,
    Param,
    Query,
    Req,
} from "@nestjs/common";
import {
    DataFilterUserModel,
    ExportTypes,
    FilterConfigurationModel,
    FilterConfigurationSearchModel,
    FilterController,
    FilterQueryModel,
    FilterResultModel,
    FilterResultModelMixin,
    SelectFilterValue,
} from "../..";
import { FilterService } from "../filter.service";
import { FilterQueryGuard } from "../guards/filter-query.guard";
import { DataFileDownloadInterceptor } from "../interceptors/data-file-download.interceptor";
import { ApiOkResponse, ApiOperation, ApiBody, ApiQuery, ApiParam } from "@nestjs/swagger";
import { FilterResourceValueModel } from "../models/filter-resource-value.model";

export function OpenApiFilterController<T extends Type, D>(
    Base: T
): Type<FilterController<D>> & (new (filterService: FilterService<D>) => FilterController<D>) {
    const _FilterResultModel = FilterResultModelMixin(Base);

    class _FilterController extends FilterController<D> {
        @Post("filter")
        @HttpCode(HttpStatus.OK)
        @UseGuards(FilterQueryGuard)
        @ApiOkResponse({ type: () => _FilterResultModel })
        @ApiOperation({ operationId: `filter${Base.name}` })
        public async filter(@Body() query: FilterQueryModel, @Req() req: any): Promise<FilterResultModel<D>> {
            return super.filter(query, req);
        }

        @Post("filter-count")
        @HttpCode(HttpStatus.OK)
        @ApiOkResponse({ schema: { type: "number" } })
        @ApiOperation({ operationId: `filter${Base.name}Count` })
        public async filterCount(@Body() query: FilterQueryModel, @Req() req: any): Promise<number> {
            return super.filterCount(query, req);
        }

        @Post("download/:type")
        @HttpCode(HttpStatus.OK)
        @UseInterceptors(DataFileDownloadInterceptor)
        @ApiOkResponse({ type: () => Buffer })
        @ApiParam({ name: "type", enum: ExportTypes, enumName: "ExportTypes" })
        @ApiOperation({ operationId: `download${Base.name}Data` })
        public async downloadData(
            @Body() query: FilterQueryModel,
            @Param("type") type: ExportTypes,
            @Req() req: any
        ): Promise<Buffer | string> {
            return super.downloadData(query, type, req);
        }

        @Post("filter/config")
        @ApiOkResponse({ type: () => FilterConfigurationModel, isArray: true })
        @ApiOperation({ operationId: `get${Base.name}FilterConfig` })
        public async getFilterConfig(@Req() req: any): Promise<FilterConfigurationModel[]> {
            return super.getFilterConfig(req);
        }

        @Post("filter/config/id")
        @ApiOkResponse({ type: () => SelectFilterValue })
        @ApiOperation({ operationId: `search${Base.name}FilterResourceValue` })
        public async searchFilterResourceValue(
            @Query() search: FilterResourceValueModel,
            @Req() req: any
        ): Promise<SelectFilterValue | null> {
            return super.searchFilterResourceValue(search, req);
        }

        @Post("filter/config/value")
        @ApiOkResponse({ type: () => SelectFilterValue, isArray: true })
        @ApiOperation({ operationId: `search${Base.name}FilterConfigValues` })
        public async searchFilterConfigValues(
            @Query() search: FilterConfigurationSearchModel,
            @Req() req: any
        ): Promise<SelectFilterValue[]> {
            return super.searchFilterConfigValues(search, req);
        }
    }

    return _FilterController;
}
