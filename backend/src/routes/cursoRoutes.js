const express = require("express");

const {
  listarCursos,
  obtenerCursoPorId,
  crearCurso,
  actualizarCurso,
  cambiarEstadoCurso,
  listarDocentesActivos,
} = require("../controllers/cursoController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

router.use(verificarToken);

router.get(
  "/docentes",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  listarDocentesActivos,
);

router.get(
  "/",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  listarCursos,
);

router.get(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  obtenerCursoPorId,
);

router.post(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  crearCurso,
);

router.put(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo"),
  actualizarCurso,
);

router.patch(
  "/:id/estado",
  verificarRol("Administrador", "Asistente Administrativo"),
  cambiarEstadoCurso,
);

module.exports = router;
