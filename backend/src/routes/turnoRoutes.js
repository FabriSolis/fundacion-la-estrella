const express = require("express");

const {
  listarTurnos,
  obtenerTurnoPorId,
  crearTurno,
  actualizarTurno,
  cambiarEstadoTurno,
  obtenerOpcionesTurno,
} = require("../controllers/turnoController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

router.use(verificarToken);

router.get(
  "/opciones",
  verificarRol("Administrador", "Asistente Administrativo", "Terapeuta"),
  obtenerOpcionesTurno,
);

router.get(
  "/",
  verificarRol("Administrador", "Asistente Administrativo", "Terapeuta"),
  listarTurnos,
);

router.get(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo", "Terapeuta"),
  obtenerTurnoPorId,
);

router.post(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  crearTurno,
);

router.put(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo"),
  actualizarTurno,
);

router.patch(
  "/:id/estado",
  verificarRol("Administrador", "Asistente Administrativo", "Terapeuta"),
  cambiarEstadoTurno,
);

module.exports = router;
