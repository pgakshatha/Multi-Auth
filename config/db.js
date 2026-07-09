// config/db.js
const { Pool } = require("pg");
const { DATABASE_URL, DB_SSL } = require("./config");

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const connectionConfig = {
  connectionString: DATABASE_URL,
};

// Enable SSL only when required
if (DB_SSL === "true") {
  connectionConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(connectionConfig);

const connectDB = async () => {
  try {
    const client = await pool.connect();

    console.log("✅ PostgreSQL Connected");

    client.release();

    return pool;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
};

module.exports = {
  connectDB,
  pool,
};
