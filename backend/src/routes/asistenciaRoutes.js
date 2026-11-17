const express = require("express");

const {
  obtenerAsistenciaClase,
  guardarAsistenciaClase,
  obtenerAsistenciaAlumno,
} = require("../controllers/asistenciaController");

const { conectarBaseDeDatos, sql } = require("../config/database");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// ==========================================
// ROLES PERMITIDOS
// ==========================================

const ADMINISTRACION = ["Administrador", "Asistente Administrativo"];

const GESTION_ASISTENCIA = [...ADMINISTRACION, "Docente"];

// ==========================================
// VERIFICAR ACCESO DEL DOCENTE
// ==========================================

async function verificarClaseDelDocente(req, res, next) {
  const rol = req.usuario?.rol;

  // Administrador y asistente pueden
  // gestionar la asistencia de todas las clases.
  if (ADMINISTRACION.includes(rol)) {
    return next();
  }

  const idUsuario = Number(req.usuario?.idUsuario);
  const idClase = Number(req.params.idClase);

  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    return res.status(401).json({
      mensaje: "Usuario autenticado inválido",
    });
  }

  if (!Number.isInteger(idClase) || idClase <= 0) {
    return res.status(400).json({
      mensaje: "Identificador de clase inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    // Comprobar que la clase pertenece
    // a un curso asignado al docente.
    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario)
      .input("idClase", sql.Int, idClase).query(`
        SELECT TOP 1
          cl.id_clase
        FROM Clase cl

        INNER JOIN Curso c
          ON c.id_curso = cl.id_curso

        INNER JOIN Docente d
          ON d.id_docente = c.id_docente

        WHERE cl.id_clase = @idClase
          AND d.id_usuario = @idUsuario
      `);

    if (resultado.recordset.length === 0) {
      return res.status(403).json({
        mensaje: "No tenés permiso para gestionar la asistencia de esta clase",
      });
    }

    return next();
  } catch (error) {
    console.error("Error al verificar acceso a la asistencia:", error);

    return res.status(500).json({
      mensaje: "Error al verificar permisos de asistencia",
    });
  }
}

// ==========================================
// ASISTENCIA POR CLASE
// ==========================================

// Consultar asistencia de una clase
router.get(
  "/clase/:idClase",
  verificarRol(...GESTION_ASISTENCIA),
  verificarClaseDelDocente,
  obtenerAsistenciaClase,
);

// Guardar asistencia de una clase
router.put(
  "/clase/:idClase",
  verificarRol(...GESTION_ASISTENCIA),
  verificarClaseDelDocente,
  guardarAsistenciaClase,
);

// ==========================================
// HISTORIAL DE ASISTENCIA DEL ALUMNO
// ==========================================

// Por ahora, solamente administración.
// Evitamos que un docente consulte libremente
// el historial de cualquier alumno mediante su ID.
router.get(
  "/alumno/:idAlumno",
  verificarRol(...ADMINISTRACION),
  obtenerAsistenciaAlumno,
);

module.exports = router;
