const { conectarBaseDeDatos, sql } = require("../config/database");

// ==========================================
// LISTAR TERAPEUTAS
// ==========================================

async function listarTerapeutas(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        t.id_terapeuta,
        t.especialidad,
        t.estado,
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.dni,
        u.telefono,
        u.email
      FROM Terapeuta t
      INNER JOIN Usuario u
        ON u.id_usuario = t.id_usuario
      ORDER BY u.apellido, u.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar terapeutas:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los terapeutas",
      error: error.message,
    });
  }
}

// ==========================================
// OBTENER TERAPEUTA POR ID
// ==========================================

async function obtenerTerapeutaPorId(req, res) {
  try {
    const idTerapeuta = Number(req.params.id);

    if (!Number.isInteger(idTerapeuta) || idTerapeuta <= 0) {
      return res.status(400).json({
        mensaje: "Identificador de terapeuta inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idTerapeuta", sql.Int, idTerapeuta).query(`
        SELECT
          t.id_terapeuta,
          t.especialidad,
          t.estado,
          u.id_usuario,
          u.nombre,
          u.apellido,
          u.dni,
          u.telefono,
          u.email
        FROM Terapeuta t
        INNER JOIN Usuario u
          ON u.id_usuario = t.id_usuario
        WHERE t.id_terapeuta = @idTerapeuta
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Terapeuta no encontrado",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener terapeuta:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el terapeuta",
      error: error.message,
    });
  }
}

// ==========================================
// MI PERFIL - TERAPEUTA
// ==========================================

// NUEVA FUNCIÓN
// Obtiene el perfil del terapeuta autenticado.
// No recibe un ID desde el frontend.

async function obtenerMiPerfil(req, res) {
  if (req.usuario?.rol !== "Terapeuta") {
    return res.status(403).json({
      mensaje: "No tenés permiso para consultar este perfil",
    });
  }

  const idUsuario = Number(req.usuario?.idUsuario);

  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    return res.status(401).json({
      mensaje: "Usuario autenticado inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario).query(`
        SELECT
          t.id_terapeuta,
          t.especialidad,
          t.estado,
          u.id_usuario,
          u.nombre,
          u.apellido,
          u.dni,
          u.telefono,
          u.email
        FROM Terapeuta t
        INNER JOIN Usuario u
          ON u.id_usuario = t.id_usuario
        WHERE t.id_usuario = @idUsuario
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró tu perfil de terapeuta",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener el perfil del terapeuta:", error);

    return res.status(500).json({
      mensaje: "Error al obtener mi perfil de terapeuta",
    });
  }
}

// ==========================================
// CREAR TERAPEUTA
// ==========================================

async function crearTerapeuta(req, res) {
  try {
    const { idUsuario, especialidad, estado = "activo" } = req.body;

    if (!idUsuario) {
      return res.status(400).json({
        mensaje: "El usuario asociado es obligatorio",
      });
    }

    const estadosPermitidos = ["activo", "inactivo"];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de terapeuta inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const usuario = await pool.request().input("idUsuario", sql.Int, idUsuario)
      .query(`
        SELECT
          u.id_usuario,
          r.nombre AS rol
        FROM Usuario u
        INNER JOIN Rol r
          ON r.id_rol = u.id_rol
        WHERE u.id_usuario = @idUsuario
      `);

    if (usuario.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "El usuario seleccionado no existe",
      });
    }

    if (usuario.recordset[0].rol !== "Terapeuta") {
      return res.status(400).json({
        mensaje: "El usuario seleccionado no posee el rol Terapeuta",
      });
    }

    const perfilExistente = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario).query(`
        SELECT id_terapeuta
        FROM Terapeuta
        WHERE id_usuario = @idUsuario
      `);

    if (perfilExistente.recordset.length > 0) {
      return res.status(409).json({
        mensaje: "El usuario ya posee un perfil de terapeuta",
      });
    }

    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario)
      .input("especialidad", sql.VarChar(100), especialidad || null)
      .input("estado", sql.VarChar(20), estado).query(`
        INSERT INTO Terapeuta (
          id_usuario,
          especialidad,
          estado
        )
        OUTPUT
          INSERTED.id_terapeuta,
          INSERTED.id_usuario,
          INSERTED.especialidad,
          INSERTED.estado
        VALUES (
          @idUsuario,
          @especialidad,
          @estado
        )
      `);

    return res.status(201).json({
      mensaje: "Terapeuta creado correctamente",
      terapeuta: resultado.recordset[0],
    });
  } catch (error) {
    console.error("Error al crear terapeuta:", error);

    return res.status(500).json({
      mensaje: "Error al crear el terapeuta",
      error: error.message,
    });
  }
}

// ==========================================
// ACTUALIZAR TERAPEUTA
// ==========================================

async function actualizarTerapeuta(req, res) {
  try {
    const idTerapeuta = Number(req.params.id);
    const { especialidad, estado } = req.body;

    if (!Number.isInteger(idTerapeuta) || idTerapeuta <= 0) {
      return res.status(400).json({
        mensaje: "Identificador de terapeuta inválido",
      });
    }

    const estadosPermitidos = ["activo", "inactivo"];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de terapeuta inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idTerapeuta", sql.Int, idTerapeuta)
      .input("especialidad", sql.VarChar(100), especialidad || null)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Terapeuta
        SET
          especialidad = @especialidad,
          estado = @estado
        WHERE id_terapeuta = @idTerapeuta;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Terapeuta no encontrado",
      });
    }

    return res.json({
      mensaje: "Terapeuta actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar terapeuta:", error);

    return res.status(500).json({
      mensaje: "Error al actualizar el terapeuta",
      error: error.message,
    });
  }
}

// ==========================================
// CAMBIAR ESTADO DEL TERAPEUTA
// ==========================================

async function cambiarEstadoTerapeuta(req, res) {
  try {
    const idTerapeuta = Number(req.params.id);
    const { estado } = req.body;

    if (!Number.isInteger(idTerapeuta) || idTerapeuta <= 0) {
      return res.status(400).json({
        mensaje: "Identificador de terapeuta inválido",
      });
    }

    const estadosPermitidos = ["activo", "inactivo"];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de terapeuta inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idTerapeuta", sql.Int, idTerapeuta)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Terapeuta
        SET estado = @estado
        WHERE id_terapeuta = @idTerapeuta;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Terapeuta no encontrado",
      });
    }

    return res.json({
      mensaje: "Estado del terapeuta actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar estado del terapeuta:", error);

    return res.status(500).json({
      mensaje: "Error al cambiar el estado del terapeuta",
      error: error.message,
    });
  }
}

// ==========================================
// LISTAR USUARIOS DISPONIBLES
// ==========================================

async function listarUsuariosDisponibles(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.dni,
        u.email
      FROM Usuario u
      INNER JOIN Rol r
        ON r.id_rol = u.id_rol
      LEFT JOIN Terapeuta t
        ON t.id_usuario = u.id_usuario
      WHERE r.nombre = 'Terapeuta'
        AND u.estado = 'activo'
        AND t.id_terapeuta IS NULL
      ORDER BY u.apellido, u.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar usuarios disponibles:", error);

    return res.status(500).json({
      mensaje: "Error al obtener usuarios disponibles",
      error: error.message,
    });
  }
}

// ==========================================
// EXPORTAR FUNCIONES
// ==========================================

module.exports = {
  listarTerapeutas,
  obtenerTerapeutaPorId,
  obtenerMiPerfil,
  crearTerapeuta,
  actualizarTerapeuta,
  cambiarEstadoTerapeuta,
  listarUsuariosDisponibles,
};
