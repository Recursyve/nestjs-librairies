import { SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { Connection } from "mongoose";
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Accounts } from "./models/accounts/accounts.model";
import { Coords } from "./models/coords/coords.model";
import { Locations } from "./models/locations/locations.model";
import { Owners } from "./models/places/owners.model";
import { Places } from "./models/places/places.model";

let sync = false;
let mongoServer: MongoMemoryServer;
let connection : Connection;

const models = [
    Accounts,
    Coords,
    Locations,
    Places,
    Owners
];

export async function databaseFactory() {
    if (sync) {
        return connection;
    }

    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getUri();
    connection = await mongoose.createConnection(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    for (const model of models) {
        connection.model(model.name, SchemaFactory.createForClass(model));
    }

    sync = true;
    return connection;
}
