const express = require("express");

const {
  listarClases,
  obtenerClasePorId,
  listarMisClases,
  crearClase,
  actualizarClase,
  cambiarEstadoClase,
  listarCursosDisponibles,
} = require("../controllers/claseController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// ====================================
// RUTAS DEL ALUMNO
// ====================================

// Consultar las clases de sus cursos
router.get("/mis-clases", verificarRol("Alumno"), listarMisClases);

// ====================================
// RUTAS ADMINISTRATIVAS
// ====================================

// Cursos disponibles para formularios
router.get(
  "/cursos",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  listarCursosDisponibles,
);

// Listar todas las clases
router.get(
  "/",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  listarClases,
);

// Obtener clase por ID
router.get(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  obtenerClasePorId,
);

// Crear clase
router.post(
  "/",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  crearClase,
);

// Actualizar clase
router.put(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  actualizarClase,
);

// Cambiar estado de una clase
router.patch(
  "/:id/estado",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  cambiarEstadoClase,
);

module.exports = router;
