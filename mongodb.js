import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let db = null;
const dbName = 'Users';

const uri = process.env.MONGODB_URI || "mongodb+srv://arivuselvam439:ari952005@cluster0.srvel.mongodb.net/Users?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

export async function connectToDatabase() {
    try {
        await client.connect();
        db = client.db(dbName);
        console.log('Connected to MongoDB successfully');
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

export function getCollection(collectionName) {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db.collection(collectionName);
}

export function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

export { client };
