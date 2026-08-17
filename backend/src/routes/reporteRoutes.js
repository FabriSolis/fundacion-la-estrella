const express = require("express");

const {
  obtenerResumenGeneral,
  obtenerPagosPorMes,
  obtenerTurnosPorEstado,
  obtenerInscripcionesPorCurso,
  obtenerAsistenciaPorCurso,
  obtenerClasesPorCurso,
  obtenerAsistenciaPorClase,
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

router.get(
  "/clases-curso/:idCurso",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  obtenerClasesPorCurso,
);

router.get(
  "/asistencia-clase/:idClase",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  obtenerAsistenciaPorClase,
);

module.exports = router;
