/**
 * ============================================================
 * FILE: config.js
 * TYPE: Configuration / Database Layer
 * JOB: Connects our Node.js app to the MongoDB database
 * INTERACTS WITH: server.js (called at startup)
 * ============================================================
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

const connectDB = async () => {
  try {
    // Start an in-memory MongoDB server since local MongoDB isn't installed
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB Connected to In-Memory DB: ${conn.connection.host}`);
    console.log(`ℹ️ Data will be lost when the server is restarted. Install local MongoDB for persistent data.`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

/*
 * ============================================================
 * END-OF-FILE SUMMARY:
 * This file handles the one-time database connection at server startup.
 * We are using 'mongodb-memory-server' to instantly provide a working database.
 * ============================================================
 */
