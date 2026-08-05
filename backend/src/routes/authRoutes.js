const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");
const express = require("express");
const {
  registrarAdministrador,
  iniciarSesion,
} = require("../controllers/authController");

const router = express.Router();

router.post("/registrar-administrador", registrarAdministrador);
router.post("/login", iniciarSesion);
router.get("/perfil", verificarToken, (req, res) => {
  res.json({
    mensaje: "Ruta protegida accesible",
    usuario: req.usuario,
  });
});

router.get(
  "/solo-administrador",
  verificarToken,
  verificarRol("Administrador"),
  (req, res) => {
    res.json({
      mensaje: "Acceso autorizado para administrador",
    });
  },
);

module.exports = router;
