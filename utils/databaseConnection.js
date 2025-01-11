import dotenv from "dotenv";
import mongoose from "mongoose";
import memoryServer from "mongodb-memory-server";
import { catchAsync, AppError } from "../middleware/errorHandlingMiddleware.js";
import { AllowedEmail } from "../models/AllowedEmail.js";
import { Image } from "../models/Image.js";
dotenv.config();

const copyCollectionData = async (
  sourceUri,
  destinationConnection,
  modelName,
  Model
) => {
  try {
    // Connect to source (production) database
    const sourceConnection = await mongoose.createConnection(sourceUri);

    // Get data from source
    const SourceModel = sourceConnection.model(modelName, Model.schema);
    const data = await SourceModel.find({});

    // Insert into destination (in-memory) database
    if (data.length > 0) {
      await Model.insertMany(data);
      console.log(
        `Copied ${data.length} documents from ${modelName} collection`
      );
    }

    // Close source connection
    await sourceConnection.close();
  } catch (error) {
    console.error(`Error copying ${modelName} collection:`, error);
  }
};

// connect to db
const connectDatabase = catchAsync(async () => {
  if (
    process.env.NODE_ENV === "test" ||
    process.env.NODE_ENV === "development"
  ) {
    // Create in-memory database
    const mongoServer = await memoryServer.MongoMemoryServer.create();
    const inMemoryUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(inMemoryUri);
    console.log("Connected to in-memory MongoDB");

    // create test allowed email
    await AllowedEmail.create({
      email: process.env.TEST_EMAIL,
      role: "admin",
    });

    console.log(
      `${process.env.TEST_EMAIL} added as admin user to allowed emails collection in in-memory database for testing, please register with this email to test dashboard with admin features`
    );

    // Copy collections from production to in-memory
    await copyCollectionData(
      process.env.MONGODB_URI,
      mongoose.connection,
      "images",
      Image
    );
  } else {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  }
});

// properly clear and close the mongoDB memory server
const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test"
    ) {
      await mongoose.connection.dropDatabase();
      await mongoServer.stop();
    }
    console.log("Database connection closed successfully");
  } catch (error) {
    console.error("Error closing database:", error);
    throw error;
  }
};

const handleShutdown = async () => {
  try {
    await closeDatabase();
    console.log("Database cleanup completed");
  } catch (error) {
    console.error("Error during database cleanup:", error);
    process.exit(1);
  }
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

export { connectDatabase, closeDatabase };
