const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,

  options: {
    instanceName: process.env.DB_INSTANCE,
    encrypt: false,
    trustServerCertificate: true,
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },

  connectionTimeout: 15000,
  requestTimeout: 15000,
};

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
