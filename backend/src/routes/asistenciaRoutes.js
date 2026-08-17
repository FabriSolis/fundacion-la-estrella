const express = require("express");

const {
  obtenerAsistenciaClase,
  guardarAsistenciaClase,
  obtenerAsistenciaAlumno,
} = require("../controllers/asistenciaController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

router.use(verificarToken);

router.get(
  "/clase/:idClase",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  obtenerAsistenciaClase,
);

router.put(
  "/clase/:idClase",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  guardarAsistenciaClase,
);

router.get(
  "/alumno/:idAlumno",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  obtenerAsistenciaAlumno,
);

module.exports = router;
