const express = require("express");

const {
  obtenerResumenGeneral,
  obtenerPagosPorMes,
  obtenerTurnosPorEstado,
  obtenerInscripcionesPorCurso,
  obtenerAsistenciaPorCurso,
} = require("../controllers/reporteController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

router.use(verificarToken);

router.get(
  "/resumen",
  verificarRol("Administrador", "Asistente Administrativo"),
  obtenerResumenGeneral,
);

router.get(
  "/pagos-mes",
  verificarRol("Administrador", "Asistente Administrativo"),
  obtenerPagosPorMes,
);

router.get(
  "/turnos-estado",
  verificarRol("Administrador", "Asistente Administrativo"),
  obtenerTurnosPorEstado,
);

router.get(
  "/inscripciones-curso",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  obtenerInscripcionesPorCurso,
);

router.get(
  "/asistencia-curso",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  obtenerAsistenciaPorCurso,
);

module.exports = router;
