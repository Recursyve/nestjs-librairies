import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Schema } from "mongoose";
import { IncludeModel } from "../models/include.model";
import { MongoUtils } from "../mongo.utils";

@Injectable()
export class MongoSchemaScanner {
    constructor(@InjectConnection() private connection: Connection) {}

    /**
     * Generate lookup aggregation
     * https://docs.mongodb.com/manual/reference/operator/aggregation/lookup
     */
    public getLookups(schema: Schema, path: string, additionalIncludes: IncludeModel[]): any[] {
        const objects = path?.split(".");
        if (!objects?.length) {
            return [];
        }

        let result = [];
        let pipeline = result;
        for (const object of objects) {
            const [obj, schemaRef] = this.findSchemaRef(schema, object);
            const [lookup, isArray] = this.getSingleLookups(obj, object);

            pipeline.push(lookup);
            if (!isArray) {
                pipeline.push({
                    $unwind: {
                        path: `$${object}`,
                        preserveNullAndEmptyArrays: true
                    }
                });
            }

            if (obj !== objects[objects.length - 1]) {
                pipeline = lookup.$lookup.pipeline;
                schema = schemaRef;
            }
        }

        const addLookups: any[][] = [];
        for (const additionalInclude of additionalIncludes) {
            addLookups.push(this.getLookups(schema, additionalInclude.path, []));
        }

        pipeline.push(...MongoUtils.reduceLookups(addLookups));

        return result;
    }

    public getSchemaFields(schema: Schema, prefix = ""): string[] {
        const fields: string[] = [];
        for (const key in schema.obj) {
            if (!schema.obj.hasOwnProperty(key)) {
                continue;
            }

            const path = schema.path(key) as any;
            if (path.instance === "ObjectID" || path.caster?.instance === "ObjectID" || path.instance === "Date") {
                continue;
            }

            if (prefix && !prefix.endsWith(".")) {
                prefix += ".";
            }
            fields.push(`${prefix}${key}`);
        }

        return fields;
    }

    public getFields(schema: Schema, path: string, additionalIncludes: IncludeModel[], prefix = ""): string[] {
        const objects = path.split(".");
        if (!objects.length) {
            return [];
        }

        const result: string[] = [];
        let pathRef: any;
        for (const obj of objects) {
            const [, schemaRef] = this.findSchemaRef(schema,  obj);
            pathRef = schema.paths[obj] as any;
            schema = schemaRef;
        }

        if (prefix && !prefix.endsWith(".")) {
            prefix += ".";
        }

        prefix += pathRef.instance === "Array" ? pathRef.caster._arrayPath : path;
        result.push(...this.getSchemaFields(schema, prefix));

        for (const include of additionalIncludes) {
            result.push(...this.getFields(schema, include.path, [], prefix));
        }

        return result;
    }

    private getSingleLookups(obj: any, path: string): [any, boolean] {
        const fromCollection = this.connection.model(obj?.ref)?.collection?.name;
        if (!fromCollection) {
            throw new Error(`No collection found for reference ${path}`);
        }

        const isArray = obj.type instanceof Array;
        const lookup =  {
            $lookup: {
                from: fromCollection,
                let: {[`${path}Id`]: `$${obj.localKey ?? path}`},
                as: path,
                pipeline: [
                    {
                        $match: {
                            $expr: isArray && !obj.foreignKey ? {
                                $in: [`$${obj.foreignKey ?? "_id"}`, `$$${path}Id`]
                            } : {
                                $eq: [`$${obj.foreignKey ?? "_id"}`, `$$${path}Id`]
                            }
                        }
                    }
                ]
            }
        };

        return [lookup, isArray];
    }

    private findSchemaRef(schema: Schema<any>, object: string): [any, Schema<any>] {
        const obj = schema.obj[object];
        if (!obj?.ref) {
            throw new Error(`No reference found for ${object}`);
        }

        const schemaRef = this.connection.model(obj.ref)?.schema;
        if (!schemaRef) {
            throw new Error(`No schema found for reference ${object}`);
        }

        return [obj, schemaRef];
    }
}
