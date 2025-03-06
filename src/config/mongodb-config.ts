import mongoose from "mongoose";
// import { env } from "process";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI as string);
    console.log("MongoDB Connected...");

    // Drop all collections
    // const db = mongoose.connection.db;
    // if (!db) {
    //   throw new Error("Database connection is not established");
    // }

    // const collections = await db.collections();

    // for (const collection of collections) {
    //   await collection.drop();
    //   console.log(`Dropped collection: ${collection.collectionName}`);
    // }

    // console.log("All collections dropped successfully.");
  } catch (error: any) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
}
