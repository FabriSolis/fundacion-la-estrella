const express = require("express");

const {
  listarDocentes,
  obtenerDocentePorId,
  crearDocente,
  actualizarDocente,
  cambiarEstadoDocente,
  listarUsuariosDisponibles,
} = require("../controllers/docenteController");

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
  listarDocentes,
);

router.get(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  obtenerDocentePorId,
);

router.post(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  crearDocente,
);

router.put(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo"),
  actualizarDocente,
);

router.patch(
  "/:id/estado",
  verificarRol("Administrador", "Asistente Administrativo"),
  cambiarEstadoDocente,
);

module.exports = router;
