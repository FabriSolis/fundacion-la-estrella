const express = require("express");

const {
  listarUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
} = require("../controllers/usuarioController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

router.use(verificarToken);
router.use(verificarRol("Administrador"));

router.get("/", listarUsuarios);
router.get("/:id", obtenerUsuarioPorId);
router.post("/", crearUsuario);
router.put("/:id", actualizarUsuario);
router.patch("/:id/estado", cambiarEstadoUsuario);

module.exports = router;
