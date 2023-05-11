import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, FilterQuery, Schema } from "mongoose";
import { IncludeModel } from "../models/include.model";
import { PathModel } from "../models/path.model";
import { MongoUtils } from "../mongo.utils";

@Injectable()
export class MongoSchemaScanner {
    constructor(@InjectConnection() private connection: Connection) {}

    /**
     * Generate lookup aggregation
     * https://docs.mongodb.com/manual/reference/operator/aggregation/lookup
     */
    public getLookups(schema: Schema, path: PathModel, additionalIncludes: IncludeModel[], attributes?: string[], fieldsToAdd?: [any, string[]]): any[] {
        const objects = path?.path?.split(".");
        if (!objects?.length) {
            return [];
        }

        let result = [];
        let pipeline = result;
        for (const object of objects) {
            const isLast = object === objects[objects.length - 1];

            const [obj, schemaRef] = this.findSchemaRef(schema, object);
            const [lookup, isArray] = this.getSingleLookups(obj, object, isLast ? path.where : null);

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
            schema = schemaRef;
        }

        if (attributes) {
            const projection = attributes.reduce((previous, current) => ({
                ...previous,
                [current]: 1
            }), {});
            pipeline.push({
                $project: projection
            } as any);
        }

        if (!fieldsToAdd) {
            fieldsToAdd = [null, []];
        }
        const [fields, unwindFields] = fieldsToAdd;
        if (fields) {
            pipeline.push({
                $addFields: fields
            });

            pipeline.push(...unwindFields.map(x => ({ $unwind: { path: `$${x}`, preserveNullAndEmptyArrays: true } })));
        }

        const addLookups: any[][] = [];
        for (const additionalInclude of additionalIncludes) {
            addLookups.push(this.getLookups(schema, { path: additionalInclude.path }, []));
        }

        pipeline.push(...MongoUtils.reduceLookups(addLookups));

        return result;
    }

    private getSingleLookups(obj: any, path: string, where?: FilterQuery<any>): [any, boolean] {
        const fromCollection = this.connection.model(obj?.ref)?.collection?.name;
        if (!fromCollection) {
            throw new Error(`No collection found for reference ${path}`);
        }

        const isArray = obj.type instanceof Array;
        const condition = isArray && !obj.foreignKey ? {
            $in: [`$${obj.foreignKey ?? "_id"}`, `$$${path}Id`]
        } : {
            $eq: [`$${obj.foreignKey ?? "_id"}`, `$$${path}Id`]
        };
        const expr = where ? {
            $and: [
                where,
                condition
            ]
        } : condition;

        const lookup =  {
            $lookup: {
                from: fromCollection,
                let: {[`${path}Id`]: `$${obj.localKey ?? path}`},
                as: path,
                pipeline: [
                    {
                        $match: {
                            $expr: expr
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
