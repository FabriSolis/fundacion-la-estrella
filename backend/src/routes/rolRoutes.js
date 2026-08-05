const express = require("express");

const { listarRoles } = require("../controllers/rolController");
const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

router.get("/", verificarToken, verificarRol("Administrador"), listarRoles);

module.exports = router;
