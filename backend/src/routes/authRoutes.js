const express = require("express");
const {
  registrarAdministrador,
  iniciarSesion,
} = require("../controllers/authController");

const router = express.Router();

router.post("/registrar-administrador", registrarAdministrador);
router.post("/login", iniciarSesion);

module.exports = router;
