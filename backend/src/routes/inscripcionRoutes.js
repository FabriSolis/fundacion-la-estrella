const express = require("express");

const {
  listarInscripciones,
  obtenerInscripcionPorId,
  crearInscripcion,
  cambiarEstadoInscripcion,
  listarAlumnosActivos,
  listarCursosDisponibles,
} = require("../controllers/inscripcionController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

router.use(verificarToken);

router.get(
  "/alumnos",
  verificarRol("Administrador", "Asistente Administrativo"),
  listarAlumnosActivos,
);

router.get(
  "/cursos",
  verificarRol("Administrador", "Asistente Administrativo"),
  listarCursosDisponibles,
);

router.get(
  "/",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  listarInscripciones,
);

router.get(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  obtenerInscripcionPorId,
);

router.post(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  crearInscripcion,
);

router.patch(
  "/:id/estado",
  verificarRol("Administrador", "Asistente Administrativo"),
  cambiarEstadoInscripcion,
);

module.exports = router;
