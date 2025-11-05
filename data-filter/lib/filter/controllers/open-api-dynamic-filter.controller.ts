import {
    applyDecorators,
    Body, Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    Req,
    Type,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiParam } from "@nestjs/swagger";
import { ApiParamOptions } from "@nestjs/swagger/dist/decorators/api-param.decorator";
import {
    DynamicFilterController,
    ExportTypes,
    FilterConfigurationModel,
    FilterConfigurationSearchModel,
    FilterQueryModel,
    FilterResultModel,
    FilterResultModelMixin,
    SelectFilterValue
} from "../..";
import { FilterService } from "../filter.service";
import { FilterQueryGuard } from "../guards/filter-query.guard";
import { DataFileDownloadInterceptor } from "../interceptors/data-file-download.interceptor";
import { FilterResourceValueModel } from "../models/filter-resource-value.model";

export type OpenApiDynamicFilterControllerOptions = {
    param?: ApiParamOptions;
};

export function OpenApiDynamicFilterController<T extends Type, D>(
    Base: T,
    options?: OpenApiDynamicFilterControllerOptions
): Type<DynamicFilterController<D>> & (abstract new (filterService: FilterService<D>) => DynamicFilterController<D>) {
    const _FilterResultModel = FilterResultModelMixin(Base);

    abstract class _FilterController extends DynamicFilterController<D> {
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
        @ApiOkResponse({
            description: "Returns file data as binary (Buffer) or as text (string) depending on the export type.",
            content: {
                "application/octet-stream": {
                    schema: {
                        oneOf: [
                            { type: "string", format: "binary" },
                            { type: "string" }
                        ]
                    }
                }
            }
        })
        @ApiParam({ name: "type", enum: ExportTypes, enumName: "ExportTypes" })
        @ApiOperation({ operationId: `download${Base.name}Data` })
        public async downloadData(
            @Body() query: FilterQueryModel,
            @Param("type") type: ExportTypes,
            @Req() req: any
        ): Promise<Buffer | string> {
            return super.downloadData(query, type, req);
        }

        @Get("filter/config")
        @ApiOkResponse({ type: () => FilterConfigurationModel, isArray: true })
        @ApiOperation({ operationId: `get${Base.name}FilterConfig` })
        public async getFilterConfig(@Req() req: any): Promise<FilterConfigurationModel[]> {
            return super.getFilterConfig(req);
        }

        @Get("filter/config/id")
        @ApiOkResponse({ type: () => SelectFilterValue })
        @ApiOperation({ operationId: `search${Base.name}FilterResourceValue` })
        public async searchFilterResourceValue(
            @Query() search: FilterResourceValueModel,
            @Req() req: any
        ): Promise<SelectFilterValue | null> {
            return super.searchFilterResourceValue(search, req);
        }

        @Get("filter/config/value")
        @ApiOkResponse({ type: () => SelectFilterValue, isArray: true })
        @ApiOperation({ operationId: `search${Base.name}FilterConfigValues` })
        public async searchFilterConfigValues(
            @Query() search: FilterConfigurationSearchModel,
            @Req() req: any
        ): Promise<SelectFilterValue[]> {
            return super.searchFilterConfigValues(search, req);
        }
    }

    if (options?.param) {
        applyDecorators(ApiParam(options.param))(_FilterController);
    }

    // @ts-ignore
    return _FilterController;
}
