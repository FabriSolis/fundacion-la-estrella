const express = require("express");

const {
  listarInscripciones,
  obtenerInscripcionPorId,
  listarMisCursos,
  crearInscripcion,
  cambiarEstadoInscripcion,
  listarAlumnosActivos,
  listarCursosDisponibles,
} = require("../controllers/inscripcionController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

// Todas las rutas requieren iniciar sesión
router.use(verificarToken);

// ====================================
// RUTAS DEL ALUMNO
// ====================================

// Consultar sus propios cursos
router.get("/mis-cursos", verificarRol("Alumno"), listarMisCursos);

// ====================================
// RUTAS ADMINISTRATIVAS
// ====================================

// Alumnos activos para inscripciones
router.get(
  "/alumnos",
  verificarRol("Administrador", "Asistente Administrativo"),
  listarAlumnosActivos,
);

// Cursos disponibles para inscripciones
router.get(
  "/cursos",
  verificarRol("Administrador", "Asistente Administrativo"),
  listarCursosDisponibles,
);

// Listar todas las inscripciones
router.get(
  "/",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  listarInscripciones,
);

// Obtener inscripción por ID
router.get(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo", "Docente"),
  obtenerInscripcionPorId,
);

// Crear inscripción
router.post(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  crearInscripcion,
);

// Cambiar estado de inscripción
router.patch(
  "/:id/estado",
  verificarRol("Administrador", "Asistente Administrativo"),
  cambiarEstadoInscripcion,
);

module.exports = router;
