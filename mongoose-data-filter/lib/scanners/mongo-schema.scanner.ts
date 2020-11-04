import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Schema } from "mongoose";

@Injectable()
export class MongoSchemaScanner {
    constructor(@InjectConnection() private connection: Connection) {
    }

    public getLookups(schema: Schema, path: string): any[] {
        const obj = schema.obj[path];
        if (!obj?.ref) {
            throw new Error(`No reference found for ${path}`);
        }

        const fromCollection = this.connection.model(obj.ref)?.collection?.name;
        if (!fromCollection) {
            throw new Error(`No collection found for reference ${path}`);
        }

        const lookup = {
            $lookup: {
                from: fromCollection,
                localField: path,
                foreignField: "_id",
                as: path
            }
        };
        if (obj.type instanceof Array) {
            return [
                lookup
            ];
        }
        return [
            lookup,
            {
                $unwind: {
                    path: `$${path}`,
                    preserveNullAndEmptyArrays: true
                }
            }
        ];
    }
}
