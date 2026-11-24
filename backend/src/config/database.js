const sql = require("mssql");
require("dotenv").config();

const esAzure = (process.env.DB_SERVER || "")
  .toLowerCase()
  .endsWith(".database.windows.net");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,

  options: {
    encrypt: esAzure,
    trustServerCertificate: !esAzure,
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },

  connectionTimeout: 60000,
  requestTimeout: 30000,
};

if (esAzure) {
  config.port = 1433;
} else if (process.env.DB_INSTANCE) {
  config.options.instanceName = process.env.DB_INSTANCE;
}

let pool;

async function conectarBaseDeDatos() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log("Conexión con SQL Server realizada correctamente");
    }

    return pool;
  } catch (error) {
    console.error("Error al conectar con SQL Server:", error.message);
    throw error;
  }
}

module.exports = {
  sql,
  conectarBaseDeDatos,
};
