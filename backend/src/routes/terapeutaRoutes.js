const express = require("express");

const {
  listarTerapeutas,
  obtenerTerapeutaPorId,
  obtenerMiPerfil,
  crearTerapeuta,
  actualizarTerapeuta,
  cambiarEstadoTerapeuta,
  listarUsuariosDisponibles,
} = require("../controllers/terapeutaController");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

// ==========================================
// AUTENTICACIÓN
// ==========================================

// Todas las rutas requieren iniciar sesión.
router.use(verificarToken);

// ==========================================
// ROLES ADMINISTRATIVOS
// ==========================================

const ADMINISTRACION = ["Administrador", "Asistente Administrativo"];

// ==========================================
// RUTAS DEL TERAPEUTA
// ==========================================

// Consultar exclusivamente su propio perfil.
// Esta ruta debe estar antes de "/:id".

router.get("/mi-perfil", verificarRol("Terapeuta"), obtenerMiPerfil);

// ==========================================
// RUTAS ADMINISTRATIVAS
// ==========================================

// Usuarios disponibles para crear terapeutas.

router.get(
  "/usuarios-disponibles",
  verificarRol(...ADMINISTRACION),
  listarUsuariosDisponibles,
);

// Listar todos los terapeutas.

router.get("/", verificarRol(...ADMINISTRACION), listarTerapeutas);

// Obtener terapeuta por ID.

router.get("/:id", verificarRol(...ADMINISTRACION), obtenerTerapeutaPorId);

// Crear terapeuta.

router.post("/", verificarRol(...ADMINISTRACION), crearTerapeuta);

// Actualizar terapeuta.

router.put("/:id", verificarRol(...ADMINISTRACION), actualizarTerapeuta);

// Cambiar estado del terapeuta.

router.patch(
  "/:id/estado",
  verificarRol(...ADMINISTRACION),
  cambiarEstadoTerapeuta,
);

module.exports = router;
