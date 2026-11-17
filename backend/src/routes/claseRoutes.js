const express = require("express");

const {
  listarClases,
  obtenerClasePorId,
  listarMisClases,
  listarMisClasesDocente,
  crearClase,
  actualizarClase,
  cambiarEstadoClase,
  listarCursosDisponibles,
} = require("../controllers/claseController");

const { listarMisCursosDocente } = require("../controllers/cursoController");

const { conectarBaseDeDatos, sql } = require("../config/database");

const { verificarToken } = require("../middleware/auth");
const { verificarRol } = require("../middleware/verificarRol");

const router = express.Router();

const ADMINISTRACION = ["Administrador", "Asistente Administrativo"];

const GESTION_CLASES = [...ADMINISTRACION, "Docente"];

router.use(verificarToken);

function validarId(valor) {
  return Number.isInteger(valor) && valor > 0;
}

// ==========================================
// VERIFICAR QUE LA CLASE SEA DEL DOCENTE
// ==========================================

async function verificarAccesoDocente(req, res, next) {
  // Administrador y asistente mantienen su acceso.
  if (req.usuario?.rol !== "Docente") {
    return next();
  }

  const idUsuario = Number(req.usuario?.idUsuario);

  if (!validarId(idUsuario)) {
    return res.status(401).json({
      mensaje: "Usuario autenticado inválido",
    });
  }

  // POST y PUT indican el curso de destino.
  const necesitaCurso = ["POST", "PUT"].includes(req.method);

  // GET por ID, PUT y PATCH trabajan con una clase existente.
  const necesitaClase = ["GET", "PUT", "PATCH"].includes(req.method);

  const idCurso = necesitaCurso ? Number(req.body?.idCurso) : null;

  const idClase = necesitaClase ? Number(req.params.id) : null;

  if (
    (necesitaCurso && !validarId(idCurso)) ||
    (necesitaClase && !validarId(idClase))
  ) {
    return res.status(400).json({
      mensaje: "Identificador de clase o curso inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario)
      .input("idCurso", sql.Int, idCurso)
      .input("idClase", sql.Int, idClase).query(`
        SELECT
          CASE
            WHEN @idCurso IS NULL OR EXISTS (
              SELECT 1
              FROM Curso c
              INNER JOIN Docente d
                ON d.id_docente = c.id_docente
              WHERE c.id_curso = @idCurso
                AND d.id_usuario = @idUsuario
            )
            THEN 1 ELSE 0
          END AS cursoPermitido,

          CASE
            WHEN @idClase IS NULL OR EXISTS (
              SELECT 1
              FROM Clase cl
              INNER JOIN Curso c
                ON c.id_curso = cl.id_curso
              INNER JOIN Docente d
                ON d.id_docente = c.id_docente
              WHERE cl.id_clase = @idClase
                AND d.id_usuario = @idUsuario
            )
            THEN 1 ELSE 0
          END AS clasePermitida
      `);

    const permisos = resultado.recordset[0];

    if (permisos.cursoPermitido !== 1 || permisos.clasePermitida !== 1) {
      return res.status(403).json({
        mensaje: "No tenés permiso para gestionar esta clase o curso",
      });
    }

    return next();
  } catch (error) {
    console.error("Error al verificar permisos del docente:", error);

    return res.status(500).json({
      mensaje: "Error al verificar permisos",
    });
  }
}

// ==========================================
// RUTAS DEL ALUMNO
// ==========================================

// Consultar las clases de sus cursos.
router.get("/mis-clases", verificarRol("Alumno"), listarMisClases);

// ==========================================
// RUTAS DEL DOCENTE
// ==========================================

// Consultar únicamente las clases de sus cursos.
router.get(
  "/mis-clases-docente",
  verificarRol("Docente"),
  listarMisClasesDocente,
);

// ==========================================
// CURSOS DISPONIBLES PARA FORMULARIOS
// ==========================================

router.get("/cursos", verificarRol(...GESTION_CLASES), (req, res) => {
  if (req.usuario?.rol === "Docente") {
    return listarMisCursosDocente(req, res);
  }

  return listarCursosDisponibles(req, res);
});

// ==========================================
// LISTAR CLASES
// ==========================================

router.get("/", verificarRol(...GESTION_CLASES), (req, res) => {
  if (req.usuario?.rol === "Docente") {
    return listarMisClasesDocente(req, res);
  }

  return listarClases(req, res);
});

// ==========================================
// OBTENER CLASE POR ID
// ==========================================

router.get(
  "/:id",
  verificarRol(...GESTION_CLASES),
  verificarAccesoDocente,
  obtenerClasePorId,
);

// ==========================================
// CREAR CLASE
// ==========================================

router.post(
  "/",
  verificarRol(...GESTION_CLASES),
  verificarAccesoDocente,
  crearClase,
);

// ==========================================
// ACTUALIZAR CLASE
// ==========================================

router.put(
  "/:id",
  verificarRol(...GESTION_CLASES),
  verificarAccesoDocente,
  actualizarClase,
);

// ==========================================
// CAMBIAR ESTADO DE CLASE
// ==========================================

router.patch(
  "/:id/estado",
  verificarRol(...GESTION_CLASES),
  verificarAccesoDocente,
  cambiarEstadoClase,
);

module.exports = router;
