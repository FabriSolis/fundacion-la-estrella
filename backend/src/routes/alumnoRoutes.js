const express = require("express");

const {
  listarAlumnos,
  obtenerAlumnoPorId,
  crearAlumno,
  actualizarAlumno,
  cambiarEstadoAlumno,
  listarUsuariosDisponibles,
} = require("../controllers/alumnoController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

router.use(verificarToken);

router.get(
  "/usuarios-disponibles",
  verificarRol("Administrador", "Asistente Administrativo"),
  listarUsuariosDisponibles,
);

router.get(
  "/",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  listarAlumnos,
);

router.get(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  obtenerAlumnoPorId,
);

router.post(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  crearAlumno,
);

router.put(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo"),
  actualizarAlumno,
);

router.patch(
  "/:id/estado",
  verificarRol("Administrador", "Asistente Administrativo"),
  cambiarEstadoAlumno,
);

module.exports = router;
