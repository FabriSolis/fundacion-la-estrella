const express = require("express");

const {
  listarPacientes,
  obtenerPacientePorId,
  crearPaciente,
  actualizarPaciente,
  cambiarEstadoPaciente,
  listarUsuariosDisponibles,
} = require("../controllers/pacienteController");

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
  verificarRol("Administrador", "Asistente Administrativo", "Terapeuta"),
  listarPacientes,
);

router.get(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo", "Terapeuta"),
  obtenerPacientePorId,
);

router.post(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  crearPaciente,
);

router.put(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo"),
  actualizarPaciente,
);

router.patch(
  "/:id/estado",
  verificarRol("Administrador", "Asistente Administrativo"),
  cambiarEstadoPaciente,
);

module.exports = router;
