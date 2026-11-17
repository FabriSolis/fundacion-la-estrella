const express = require("express");

const {
  listarDocentes,
  obtenerDocentePorId,
  obtenerMiPerfil,
  crearDocente,
  actualizarDocente,
  cambiarEstadoDocente,
  listarUsuariosDisponibles,
} = require("../controllers/docenteController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

// Todas las rutas requieren iniciar sesión
router.use(verificarToken);

// ==========================================
// RUTAS DEL DOCENTE
// ==========================================

// Consultar su propio perfil
router.get("/mi-perfil", verificarRol("Docente"), obtenerMiPerfil);

// ==========================================
// RUTAS ADMINISTRATIVAS
// ==========================================

// Usuarios disponibles para crear docentes
router.get(
  "/usuarios-disponibles",
  verificarRol("Administrador", "Asistente Administrativo"),
  listarUsuariosDisponibles,
);

// Listar todos los docentes
router.get(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  listarDocentes,
);

// Obtener docente por ID
router.get(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo"),
  obtenerDocentePorId,
);

// Crear docente
router.post(
  "/",
  verificarRol("Administrador", "Asistente Administrativo"),
  crearDocente,
);

// Actualizar docente
router.put(
  "/:id",
  verificarRol("Administrador", "Asistente Administrativo"),
  actualizarDocente,
);

// Cambiar estado del docente
router.patch(
  "/:id/estado",
  verificarRol("Administrador", "Asistente Administrativo"),
  cambiarEstadoDocente,
);

module.exports = router;
