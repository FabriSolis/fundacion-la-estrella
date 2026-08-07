const express = require("express");

const router = express.Router();

const {
  obtenerSesionPorTurno,
  obtenerHistorialPaciente,
  crearSesion,
  actualizarSesion,
} = require("../controllers/sesionController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

router.use(verificarToken);

router.get(
  "/turno/:idTurno",
  verificarRol("Administrador", "Terapeuta", "Asistente Administrativo"),
  obtenerSesionPorTurno,
);

router.get(
  "/paciente/:idPaciente",
  verificarRol("Administrador", "Terapeuta", "Asistente Administrativo"),
  obtenerHistorialPaciente,
);

router.post("/", verificarRol("Administrador", "Terapeuta"), crearSesion);

router.put(
  "/:id",
  verificarRol("Administrador", "Terapeuta"),
  actualizarSesion,
);

module.exports = router;
