import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Schema } from "mongoose";

@Injectable()
export class MongoSchemaScanner {
    constructor(@InjectConnection() private connection: Connection) {}

    public getLookups(schema: Schema, path: string): any[] {
        const objects = path?.split(".");
        if (!objects?.length) {
            return [];
        }

        let result = [];
        let pipeline = result;
        let lookup: any = {};
        for (const object of objects) {
            const obj = schema.obj[object];
            if (!obj?.ref) {
                throw new Error(`No reference found for ${object}`);
            }

            const fromCollection = this.connection.model(obj.ref)?.collection?.name;
            if (!fromCollection) {
                throw new Error(`No collection found for reference ${object}`);
            }

            const isArray = obj.type instanceof Array;
            lookup.$lookup =  {
                from: fromCollection,
                let: { [`${object}Id`]: `$${object}` },
                as: object,
                pipeline: [
                    {
                        $match: {
                            $expr: isArray ? {
                                $in: ['$_id', `$$${object}Id`]
                            } : {
                                $eq: ["$_id", `$$${object}Id`]
                            }
                        }
                    }
                ]
            };

            pipeline.push(lookup);
            if (!isArray) {
                pipeline.push({
                    $unwind: {
                        path: `$${object}`,
                        preserveNullAndEmptyArrays: true
                    }
                });
            }

            pipeline = lookup.$lookup.pipeline;
            lookup = {};
            schema = this.connection.model(obj.ref).schema;
        }

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

            fields.push(`${prefix}key`);
        }

        return fields;
    }

    public getFields(schema: Schema, path: string): string[] {
        const obj = schema.obj[path];
        if (!obj?.ref) {
            throw new Error(`No reference found for ${path}`);
        }

        const schemaRef = this.connection.model(obj.ref)?.schema;
        if (!schemaRef) {
            throw new Error(`No schema found for reference ${path}`);
        }

        const pathRef = schema.paths[path] as any;
        if (pathRef.instance === "Array") {
            return this.getSchemaFields(schemaRef, pathRef.caster._arrayPath);
        } else {
            return this.getSchemaFields(schemaRef, path)
        }
    }
}
