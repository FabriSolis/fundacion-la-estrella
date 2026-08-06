const express = require("express");

const {
  listarTerapeutas,
  obtenerTerapeutaPorId,
  crearTerapeuta,
  actualizarTerapeuta,
  cambiarEstadoTerapeuta,
  listarUsuariosDisponibles,
} = require("../controllers/terapeutaController");

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
  verificarRol("Administrador", "Asistente Administrativo"),
  listarTerapeutas,
);

router.get(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo"),
  obtenerTerapeutaPorId,
);

router.post(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  crearTerapeuta,
);

router.put(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo"),
  actualizarTerapeuta,
);

router.patch(
  "/:id/estado",
  verificarRol("Administrador", "Asistente Administrativo"),
  cambiarEstadoTerapeuta,
);

module.exports = router;
