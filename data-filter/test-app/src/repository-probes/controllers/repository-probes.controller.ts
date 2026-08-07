import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req } from "@nestjs/common";
import { DataFilterService, ExportTypes } from "@recursyve/nestjs-data-filter";
import { Request } from "express";
import { Op } from "sequelize";
import { MuseumsPlainData, MuseumsWithArtifactsData } from "../../museums/filters";
import { TestAccessControlUser } from "../../test-access-control/test-access-control-user.model";

/**
 * Characterizes the public DataFilterService.for → DataFilterRepository API
 * directly (consumer DI path), not via FilterController.
 */
@Controller("repository-probes")
export class RepositoryProbesController {
    constructor(private readonly dataFilterService: DataFilterService) {}

    private plainRepo() {
        return this.dataFilterService.for(MuseumsPlainData);
    }

    private nestedRepo() {
        return this.dataFilterService.for(MuseumsWithArtifactsData);
    }

    private userFromRequest(request: {
        headers?: Record<string, string | string[] | undefined>;
    }): TestAccessControlUser {
        const raw = request.headers?.["x-test-user"];
        const value = Array.isArray(raw) ? raw[0] : raw;
        if (!value) {
            return { language: "fr" };
        }

        return JSON.parse(value) as TestAccessControlUser;
    }

    @Get("by-pk/:id")
    @HttpCode(HttpStatus.OK)
    public async findByPk(@Param("id") id: string) {
        const row = await this.nestedRepo().findByPk(Number(id));

        return {
            found: row !== null,
            id: row?.id ?? null,
            name: row?.name ?? null,
            artifactTitles: (row?.artifacts ?? []).map((a) => a.title ?? "")
        };
    }

    @Get("by-pk-from-user/:id")
    @HttpCode(HttpStatus.OK)
    public async findByPkFromUser(@Param("id") id: string, @Req() request: Request) {
        const row = await this.plainRepo().findByPkFromUser(this.userFromRequest(request), Number(id));

        return {
            found: row !== null,
            id: row?.id ?? null
        };
    }

    @Post("find-all")
    @HttpCode(HttpStatus.OK)
    public async findAll() {
        const rows = await this.plainRepo().findAll({
            where: {},
            order: [["id", "ASC"]]
        });

        return {
            ids: rows.map((row) => row.id),
            names: rows.map((row) => row.name ?? "")
        };
    }

    @Post("find-all-from-user")
    @HttpCode(HttpStatus.OK)
    public async findAllFromUser(@Req() request: Request) {
        const rows = await this.plainRepo().findAllFromUser(this.userFromRequest(request), {
            order: [["id", "ASC"]]
        });

        return {
            ids: rows.map((row) => row.id)
        };
    }

    @Post("find-one")
    @HttpCode(HttpStatus.OK)
    public async findOne(@Query("name") name: string) {
        const row = await this.plainRepo().findOne({ where: { name } });

        return {
            found: row !== null,
            id: row?.id ?? null
        };
    }

    @Post("count")
    @HttpCode(HttpStatus.OK)
    public async count() {
        const total = await this.plainRepo().count();
        return { total };
    }

    /**
     * @p0 suspected-defect
     * repository.count() with nested HasMany path attributes generates a JOIN
     * without a valid GROUP BY under MySQL only_full_group_by.
     */
    @Post("count-nested")
    @HttpCode(HttpStatus.OK)
    public async countNested() {
        try {
            const total = await this.nestedRepo().count();
            return { total, errored: false };
        } catch (error) {
            return {
                total: null,
                errored: true,
                message: error instanceof Error ? error.message : String(error)
            };
        }
    }

    @Post("count-from-user")
    @HttpCode(HttpStatus.OK)
    public async countFromUser(@Req() request: Request) {
        const total = await this.plainRepo().countFromUser(this.userFromRequest(request));
        return { total };
    }

    @Post("search")
    @HttpCode(HttpStatus.OK)
    public async search(@Query("q") q: string, @Query("lang") lang?: string) {
        const rows = await this.plainRepo().search(q, lang ?? "fr");

        return {
            ids: rows.map((row) => row.id),
            names: rows.map((row) => row.name ?? "")
        };
    }

    @Post("search-from-user")
    @HttpCode(HttpStatus.OK)
    public async searchFromUser(@Query("q") q: string, @Req() request: Request) {
        const rows = await this.plainRepo().searchFromUser(this.userFromRequest(request), q);

        return {
            ids: rows.map((row) => row.id)
        };
    }

    @Get("custom-attribute/:name")
    @HttpCode(HttpStatus.OK)
    public hasCustomAttribute(@Param("name") name: string) {
        const repository = this.plainRepo();

        return {
            has: repository.hasCustomAttribute(name),
            attribute: repository.getCustomAttribute(name)?.type ?? null,
            groupBy: repository.getCustomAttributeGroupBy()
        };
    }

    @Get("search-attributes")
    @HttpCode(HttpStatus.OK)
    public searchAttributes() {
        const repository = this.plainRepo();

        return {
            attributes: repository.getSearchAttributes().map((a) => ({ name: a.name, key: a.key })),
            translations: repository.getSearchTranslationAttributes().map((a) => ({ name: a.name, key: a.key }))
        };
    }

    @Post("download-csv")
    @HttpCode(HttpStatus.OK)
    public async downloadCsv() {
        const rows = await this.plainRepo().findAll({ order: [["id", "ASC"]] });
        const buffer = await this.plainRepo().downloadData(rows, ExportTypes.CSV, "fr");

        return {
            byteLength: Buffer.isBuffer(buffer) ? buffer.byteLength : Buffer.byteLength(String(buffer)),
            preview: Buffer.isBuffer(buffer) ? buffer.toString("utf8").slice(0, 200) : String(buffer).slice(0, 200)
        };
    }

    @Post("find-one-from-user")
    @HttpCode(HttpStatus.OK)
    public async findOneFromUser(@Query("name") name: string, @Req() request: Request) {
        const row = await this.plainRepo().findOneFromUser(this.userFromRequest(request), {
            where: { name }
        });

        return {
            found: row !== null,
            id: row?.id ?? null
        };
    }

    @Post("generate-options")
    @HttpCode(HttpStatus.OK)
    public generateOptions() {
        const options = this.nestedRepo().generateFindOptions({ where: { [Op.and]: [] } }, {});
        const orderIncludes = this.nestedRepo().generateOrderInclude({ column: "name", direction: "asc" });
        const searchIncludes = this.nestedRepo().generateSearchInclude({});

        return {
            hasInclude: Array.isArray(options.include) ? options.include.length > 0 : !!options.include,
            orderIncludeCount: orderIncludes.length,
            searchIncludeCount: Array.isArray(searchIncludes) ? searchIncludes.length : 0,
            modelName: this.nestedRepo().model.name
        };
    }
}
