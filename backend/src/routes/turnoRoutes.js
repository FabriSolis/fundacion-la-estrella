const express = require("express");

const {
  listarTurnos,
  listarMisTurnosTerapeuta,
  obtenerTurnoPorId,
  crearTurno,
  actualizarTurno,
  cambiarEstadoTurno,
  obtenerOpcionesTurno,
} = require("../controllers/turnoController");

const { conectarBaseDeDatos, sql } = require("../config/database");
const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

// ==========================================
// AUTENTICACIÓN
// ==========================================

router.use(verificarToken);

// ==========================================
// ROLES
// ==========================================

const ADMINISTRACION = ["Administrador", "Asistente Administrativo"];

const GESTION_TURNOS = [...ADMINISTRACION, "Terapeuta"];

// ==========================================
// VERIFICAR ACCESO A UN TURNO
// ==========================================

// Administradores y asistentes pueden consultar
// y gestionar cualquier turno.
//
// Los terapeutas solo pueden acceder a turnos
// que estén asignados a su propio perfil.

async function verificarTurnoPropio(req, res, next) {
  if (req.usuario?.rol !== "Terapeuta") {
    return next();
  }

  const idUsuario = Number(req.usuario?.idUsuario);
  const idTurno = Number(req.params.id);

  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    return res.status(401).json({
      mensaje: "Usuario autenticado inválido",
    });
  }

  if (!Number.isInteger(idTurno) || idTurno <= 0) {
    return res.status(400).json({
      mensaje: "Identificador de turno inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario)
      .input("idTurno", sql.Int, idTurno).query(`
        SELECT tu.id_turno
        FROM Turno tu
        INNER JOIN Terapeuta t
          ON t.id_terapeuta = tu.id_terapeuta
        WHERE tu.id_turno = @idTurno
          AND t.id_usuario = @idUsuario
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Turno no encontrado",
      });
    }

    return next();
  } catch (error) {
    console.error("Error al verificar acceso al turno:", error);

    return res.status(500).json({
      mensaje: "Error al verificar el acceso al turno",
    });
  }
}

// ==========================================
// RUTAS DEL TERAPEUTA
// ==========================================

// Listar únicamente los turnos del
// terapeuta autenticado.

router.get(
  "/mis-turnos-terapeuta",
  verificarRol("Terapeuta"),
  listarMisTurnosTerapeuta,
);

// ==========================================
// RUTAS ADMINISTRATIVAS
// ==========================================

// Obtener pacientes y terapeutas disponibles
// para registrar turnos.

router.get("/opciones", verificarRol(...ADMINISTRACION), obtenerOpcionesTurno);

// Listar todos los turnos.

router.get("/", verificarRol(...ADMINISTRACION), listarTurnos);

// ==========================================
// CONSULTAR TURNO POR ID
// ==========================================

// El terapeuta solo puede consultar
// un turno que tenga asignado.

router.get(
  "/:id",
  verificarRol(...GESTION_TURNOS),
  verificarTurnoPropio,
  obtenerTurnoPorId,
);

// ==========================================
// CREAR TURNO
// ==========================================

router.post("/", verificarRol(...ADMINISTRACION), crearTurno);

// ==========================================
// ACTUALIZAR TURNO
// ==========================================

router.put("/:id", verificarRol(...ADMINISTRACION), actualizarTurno);

// ==========================================
// CAMBIAR ESTADO DEL TURNO
// ==========================================

// Administración: cualquier turno.
// Terapeuta: solamente sus turnos.

router.patch(
  "/:id/estado",
  verificarRol(...GESTION_TURNOS),
  verificarTurnoPropio,
  cambiarEstadoTurno,
);

module.exports = router;
