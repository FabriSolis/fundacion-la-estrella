const express = require("express");

const {
  listarClases,
  obtenerClasePorId,
  crearClase,
  actualizarClase,
  cambiarEstadoClase,
  listarCursosDisponibles,
} = require("../controllers/claseController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

router.use(verificarToken);

router.get(
  "/cursos",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  listarCursosDisponibles,
);

router.get(
  "/",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  listarClases,
);

router.get(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  obtenerClasePorId,
);

router.post(
  "/",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  crearClase,
);

router.put(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  actualizarClase,
);

router.patch(
  "/:id/estado",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  cambiarEstadoClase,
);

module.exports = router;
