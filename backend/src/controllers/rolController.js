const { conectarBaseDeDatos } = require("../config/database");

async function listarRoles(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        id_rol,
        nombre,
        descripcion
      FROM Rol
      ORDER BY nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar roles:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los roles",
      error: error.message,
    });
  }
}

module.exports = {
  listarRoles,
};
