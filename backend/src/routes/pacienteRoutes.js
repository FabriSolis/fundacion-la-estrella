const express = require("express");

const {
  listarPacientes,
  listarMisPacientesTerapeuta,
  obtenerPacientePorId,
  crearPaciente,
  actualizarPaciente,
  cambiarEstadoPaciente,
  listarUsuariosDisponibles,
} = require("../controllers/pacienteController");

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

const CONSULTA_PACIENTES = [...ADMINISTRACION, "Terapeuta"];

// ==========================================
// VERIFICAR PACIENTE ASIGNADO
// ==========================================

// Administración puede consultar cualquier paciente.
//
// El terapeuta solamente puede consultar
// pacientes vinculados a sus propios turnos.

async function verificarPacienteAsignado(req, res, next) {
  if (req.usuario?.rol !== "Terapeuta") {
    return next();
  }

  const idUsuario = Number(req.usuario?.idUsuario);
  const idPaciente = Number(req.params.id);

  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    return res.status(401).json({
      mensaje: "Usuario autenticado inválido",
    });
  }

  if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
    return res.status(400).json({
      mensaje: "Identificador de paciente inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario)
      .input("idPaciente", sql.Int, idPaciente).query(`
        SELECT p.id_paciente
        FROM Paciente p
        WHERE p.id_paciente = @idPaciente
          AND EXISTS (
            SELECT 1
            FROM Turno tu
            INNER JOIN Terapeuta t
              ON t.id_terapeuta = tu.id_terapeuta
            WHERE tu.id_paciente = p.id_paciente
              AND t.id_usuario = @idUsuario
              AND tu.estado NOT IN (
                'cancelado',
                'reprogramado'
              )
          )
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado",
      });
    }

    return next();
  } catch (error) {
    console.error("Error al verificar acceso al paciente:", error);

    return res.status(500).json({
      mensaje: "Error al verificar acceso al paciente",
    });
  }
}

// ==========================================
// RUTAS DEL TERAPEUTA
// ==========================================

// Listar únicamente sus pacientes.

router.get(
  "/mis-pacientes-terapeuta",
  verificarRol("Terapeuta"),
  listarMisPacientesTerapeuta,
);

// ==========================================
// RUTAS ADMINISTRATIVAS
// ==========================================

// Usuarios disponibles para crear pacientes.

router.get(
  "/usuarios-disponibles",
  verificarRol(...ADMINISTRACION),
  listarUsuariosDisponibles,
);

// Listar todos los pacientes.

router.get("/", verificarRol(...ADMINISTRACION), listarPacientes);

// ==========================================
// CONSULTAR PACIENTE POR ID
// ==========================================

// Administración: cualquier paciente.
// Terapeuta: solamente pacientes vinculados.

router.get(
  "/:id",
  verificarRol(...CONSULTA_PACIENTES),
  verificarPacienteAsignado,
  obtenerPacientePorId,
);

// ==========================================
// CREAR PACIENTE
// ==========================================

router.post("/", verificarRol(...ADMINISTRACION), crearPaciente);

// ==========================================
// ACTUALIZAR PACIENTE
// ==========================================

router.put("/:id", verificarRol(...ADMINISTRACION), actualizarPaciente);

// ==========================================
// CAMBIAR ESTADO DEL PACIENTE
// ==========================================

router.patch(
  "/:id/estado",
  verificarRol(...ADMINISTRACION),
  cambiarEstadoPaciente,
);

module.exports = router;
