const express = require("express");

const {
  listarCursos,
  listarMisCursosDocente,
  obtenerCursoPorId,
  crearCurso,
  actualizarCurso,
  cambiarEstadoCurso,
  listarDocentesActivos,
} = require("../controllers/cursoController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

// Todas las rutas requieren iniciar sesión
router.use(verificarToken);

// ==========================================
// RUTAS DEL DOCENTE
// ==========================================

// Consultar únicamente sus cursos asignados
router.get("/mis-cursos", verificarRol("Docente"), listarMisCursosDocente);

// ==========================================
// RUTAS ADMINISTRATIVAS
// ==========================================

// Docentes disponibles para asignar a cursos
router.get(
  "/docentes",
  verificarRol("Administrador", "Asistente Administrativo"),
  listarDocentesActivos,
);

// Listar todos los cursos
router.get(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  listarCursos,
);

// Obtener un curso por ID
router.get(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo"),
  obtenerCursoPorId,
);

// Crear curso
router.post(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  crearCurso,
);

// Actualizar curso
router.put(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo"),
  actualizarCurso,
);

// Cambiar estado del curso
router.patch(
  "/:id/estado",
  verificarRol("Administrador", "Asistente Administrativo"),
  cambiarEstadoCurso,
);

module.exports = router;
