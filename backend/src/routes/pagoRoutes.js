const express = require("express");

const {
  listarPagos,
  obtenerPagoPorId,
  crearPago,
  actualizarPago,
  cambiarEstadoPago,
  obtenerOpcionesPago,
} = require("../controllers/pagoController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

router.use(verificarToken);

router.get(
  "/opciones",
  verificarRol("Administrador", "Asistente Administrativo"),
  obtenerOpcionesPago,
);

router.get(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  listarPagos,
);

router.get(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo"),
  obtenerPagoPorId,
);

router.post(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  crearPago,
);

router.put(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo"),
  actualizarPago,
);

router.patch(
  "/:id/estado",
  verificarRol("Administrador", "Asistente Administrativo"),
  cambiarEstadoPago,
);

module.exports = router;
