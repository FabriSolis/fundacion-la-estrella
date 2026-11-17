const express = require("express");

const {
  listarInscripciones,
  obtenerInscripcionPorId,
  listarMisCursos,
  listarMisAlumnosDocente,
  crearInscripcion,
  cambiarEstadoInscripcion,
  listarAlumnosActivos,
  listarCursosDisponibles,
} = require("../controllers/inscripcionController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

// ====================================
// AUTENTICACIÓN
// ====================================

// Todas las rutas requieren iniciar sesión.
router.use(verificarToken);

// ====================================
// ROLES ADMINISTRATIVOS
// ====================================

const ADMINISTRACION = ["Administrador", "Asistente Administrativo"];

// ====================================
// RUTAS DEL ALUMNO
// ====================================

// Consultar sus propios cursos.
router.get("/mis-cursos", verificarRol("Alumno"), listarMisCursos);

// ====================================
// RUTAS DEL DOCENTE
// ====================================

// Consultar únicamente los alumnos
// de los cursos asignados al docente.
router.get(
  "/mis-alumnos-docente",
  verificarRol("Docente"),
  listarMisAlumnosDocente,
);

// ====================================
// RUTAS ADMINISTRATIVAS
// ====================================

// Alumnos activos para inscripciones.
router.get("/alumnos", verificarRol(...ADMINISTRACION), listarAlumnosActivos);

// Cursos disponibles para inscripciones.
router.get("/cursos", verificarRol(...ADMINISTRACION), listarCursosDisponibles);

// Listar todas las inscripciones.
router.get("/", verificarRol(...ADMINISTRACION), listarInscripciones);

// Obtener inscripción por ID.
router.get("/:id", verificarRol(...ADMINISTRACION), obtenerInscripcionPorId);

// Crear inscripción.
router.post("/", verificarRol(...ADMINISTRACION), crearInscripcion);

// Cambiar estado de inscripción.
router.patch(
  "/:id/estado",
  verificarRol(...ADMINISTRACION),
  cambiarEstadoInscripcion,
);

module.exports = router;
