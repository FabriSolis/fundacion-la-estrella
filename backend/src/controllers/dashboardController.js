const { conectarBaseDeDatos } = require("../config/database");

async function obtenerIndicadores(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Usuario) AS usuarios,
        (SELECT COUNT(*) FROM Paciente WHERE estado = 'activo') AS pacientes,
        (SELECT COUNT(*) FROM Alumno WHERE estado = 'activo') AS alumnos,
        (
          SELECT COUNT(*)
          FROM Turno
          WHERE fecha = CAST(GETDATE() AS DATE)
            AND estado IN ('solicitado', 'confirmado')
        ) AS turnosHoy
    `);

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener indicadores:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los indicadores",
      error: error.message,
    });
  }
}

module.exports = {
  obtenerIndicadores,
};
