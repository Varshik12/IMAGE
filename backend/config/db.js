import mongoose from "mongoose"; // Mongoose library for MongoDB database object modeling and schema structure
import dotenv from "dotenv"; // Dotenv library to load secret credentials from the .env environment file
import fs from "fs"; // File system core module for synchronous read and write file operations
import path from "path"; // Path utility module to resolve files and directories layout structures
import { fileURLToPath } from "url"; // Utility to safely resolve ES module file URL and path metadata

dotenv.config(); // Parse and load all configurations variables securely from the .env file

// Variables to dynamically track the active database state
let isMongooseConnected = false; // Default status of database connection set to false during server startup
let dbMode = "Local Sandbox Fallback"; // Default database display state text initialized for Local Sandbox Mode

// Dynamic transient arrays to keep data only in RAM when MongoDB is not active
const projectRoot = process.cwd().endsWith("backend") ? process.cwd() : path.join(process.cwd(), "backend");
const dbDataDir = path.join(projectRoot, "data");

if (!fs.existsSync(dbDataDir)) {
  fs.mkdirSync(dbDataDir, { recursive: true });
}

const usersFile = path.join(dbDataDir, "users.json");
const imagesFile = path.join(dbDataDir, "images.json");

const loadLocalData = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const dataStr = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(dataStr);
    }
  } catch (err) {
    console.error("Error reading JSON db:", err);
  }
  return [];
};

const saveLocalData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing JSON db:", err);
  }
};

/**
 * Connect to MongoDB - Primary asynchronous entry point for database setup.
 *
 * Handles automatic fallback to local JSON sandbox database if the Mongo URI is missing or a placeholder.
 */
export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  // Verify whether MONGO_URI is missing or contains placeholder keys. If so, initialize Transient In-Memory storage
  if (!mongoUri || mongoUri.includes("<db_password>") || mongoUri.includes("YOUR_") || mongoUri === "") {
    console.log("⚠️ [Database] MONGO_URI is missing or contains a placeholder. Running fallback modes."); 
    console.log("💾 [Database] SWITCHING TO SECURE FILE SYSTEM PERSISTENCE (Local JSON Sandbox Mode).");
    isMongooseConnected = false;
    dbMode = "Local Sandbox Fallback";
    try {
      fs.writeFileSync(usersFile, "[]", "utf-8");
      console.log("💾 [Database] MongoDB disconnected. Cleared local users database for 'create fresh user every time' compliance.");
    } catch (fsErr) {
      console.warn("⚠️ [Database] Failed to clear local users database on startup:", fsErr.message);
    }
    return;
  }

  try {
    console.log("🔌 [Database] Attempting connection to MongoDB Atlas Cluster...");

    // Instruct mongoose connection driver to trigger handshake using standard timeout limits of 5 seconds
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Abort database search attempts if offline for more than 5 seconds
      connectTimeoutMS: 5000, // Drop connections handshake requests if server is unresponsive
    });

    isMongooseConnected = true;
    dbMode = "MongoDB Atlas Cluster";
    console.log(`✅ [Database] Connection established successfully! Connected to host: ${mongoose.connection.host}`);

    // Drop legacy conflicting index 'id_1' if present on collections to prevent duplicate key error { id: null }
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map((c) => c.name);
      for (const colName of ["users", "images"]) {
        if (collectionNames.includes(colName)) {
          const indexes = await mongoose.connection.db.collection(colName).indexes();
          const hasIdIndex = indexes.some((idx) => idx.name === "id_1");
          if (hasIdIndex) {
            console.log(`🧹 [Database] Dropping conflicting legacy index 'id_1' from '${colName}' collection...`);
            await mongoose.connection.db.collection(colName).dropIndex("id_1");
            console.log(`✅ [Database] Conflicting index 'id_1' on '${colName}' removed successfully!`);
          }
        }
      }
    } catch (indexCleanupErr) {
      console.warn("⚠️ [Database] Index cleanup check notice:", indexCleanupErr.message);
    }
  } catch (error) {
    console.error(`❌ [Database] Connection attempt failed with error: ${error.message}`);
    console.log("💾 [Database] AUTOMATIC FALLBACK: Running file system JSON persistence to guarantee absolute uptime.");
    isMongooseConnected = false;
    dbMode = "Local Sandbox Fallback";
    try {
      fs.writeFileSync(usersFile, "[]", "utf-8");
      console.log("💾 [Database] MongoDB connection failed. Cleared local users database for 'create fresh user every time' compliance.");
    } catch (fsErr) {
      console.warn("⚠️ [Database] Failed to clear local users database on connection failure:", fsErr.message);
    }
  }
};

/**
 * Returns current status of MongoDB Connection
 */
export const isConnected = () => {
  return isMongooseConnected && mongoose.connection.readyState === 1;
};

/**
 * Returns current Database Mode state label to show in UI Header & Profile dashboard statistics
 */
export const getDatabaseMode = () => {
  return dbMode;
};

/**
 * Structured methods utility to perform clean offline database mapping transactions on in-memory arrays in RAM
 */
export const localDb = {
  getUsers: () => {
    return loadLocalData(usersFile); // Return in-memory user list
  },
  saveUsers: (users) => {
    saveLocalData(usersFile, users); // Update RAM in-memory user table
  },
  getImages: () => {
    return loadLocalData(imagesFile); // Return in-memory image list
  },
  saveImages: (images) => {
    saveLocalData(imagesFile, images); // Update RAM in-memory image table
  }
};
