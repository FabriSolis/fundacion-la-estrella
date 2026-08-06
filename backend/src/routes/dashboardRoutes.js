const express = require("express");

const { obtenerIndicadores } = require("../controllers/dashboardController");

const { verificarToken } = require("../middleware/auth");

const router = express.Router();

router.get("/indicadores", verificarToken, obtenerIndicadores);

module.exports = router;
