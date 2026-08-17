const { conectarBaseDeDatos, sql } = require("../config/database");

const ESTADOS_PERMITIDOS = ["activo", "inactivo"];

function validarId(valor) {
  return Number.isInteger(valor) && valor > 0;
}

async function listarDocentes(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        d.id_docente,
        d.id_usuario,
        d.especialidad,
        d.estado,
        u.nombre,
        u.apellido,
        u.dni,
        u.telefono,
        u.email
      FROM Docente d
      INNER JOIN Usuario u
        ON u.id_usuario = d.id_usuario
      ORDER BY u.apellido, u.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar docentes:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los docentes",
      error: error.message,
    });
  }
}

async function obtenerDocentePorId(req, res) {
  try {
    const idDocente = Number(req.params.id);

    if (!validarId(idDocente)) {
      return res.status(400).json({
        mensaje: "Identificador de docente inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idDocente", sql.Int, idDocente).query(`
        SELECT
          d.id_docente,
          d.id_usuario,
          d.especialidad,
          d.estado,
          u.nombre,
          u.apellido,
          u.dni,
          u.telefono,
          u.email
        FROM Docente d
        INNER JOIN Usuario u
          ON u.id_usuario = d.id_usuario
        WHERE d.id_docente = @idDocente
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Docente no encontrado",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener docente:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el docente",
      error: error.message,
    });
  }
}

async function crearDocente(req, res) {
  try {
    const { idUsuario, especialidad, estado = "activo" } = req.body;

    const idUsuarioNumero = Number(idUsuario);

    if (!validarId(idUsuarioNumero)) {
      return res.status(400).json({
        mensaje: "El usuario asociado es obligatorio",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de docente inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const usuario = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuarioNumero).query(`
        SELECT
          u.id_usuario,
          u.estado,
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

    if (usuario.recordset[0].rol !== "Docente") {
      return res.status(400).json({
        mensaje: "El usuario seleccionado no posee el rol Docente",
      });
    }

    if (usuario.recordset[0].estado !== "activo") {
      return res.status(400).json({
        mensaje: "El usuario seleccionado se encuentra inactivo",
      });
    }

    const existente = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuarioNumero).query(`
        SELECT id_docente
        FROM Docente
        WHERE id_usuario = @idUsuario
      `);

    if (existente.recordset.length > 0) {
      return res.status(409).json({
        mensaje: "El usuario ya posee un perfil de docente",
      });
    }

    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuarioNumero)
      .input("especialidad", sql.VarChar(100), especialidad?.trim() || null)
      .input("estado", sql.VarChar(20), estado).query(`
        INSERT INTO Docente (
          id_usuario,
          especialidad,
          estado
        )
        OUTPUT
          INSERTED.id_docente,
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
      mensaje: "Docente creado correctamente",
      docente: resultado.recordset[0],
    });
  } catch (error) {
    console.error("Error al crear docente:", error);

    return res.status(500).json({
      mensaje: "Error al crear el docente",
      error: error.message,
    });
  }
}

async function actualizarDocente(req, res) {
  try {
    const idDocente = Number(req.params.id);

    const { especialidad, estado } = req.body;

    if (!validarId(idDocente)) {
      return res.status(400).json({
        mensaje: "Identificador de docente inválido",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de docente inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idDocente", sql.Int, idDocente)
      .input("especialidad", sql.VarChar(100), especialidad?.trim() || null)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Docente
        SET
          especialidad = @especialidad,
          estado = @estado
        WHERE id_docente = @idDocente;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Docente no encontrado",
      });
    }

    return res.json({
      mensaje: "Docente actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar docente:", error);

    return res.status(500).json({
      mensaje: "Error al actualizar el docente",
      error: error.message,
    });
  }
}

async function cambiarEstadoDocente(req, res) {
  try {
    const idDocente = Number(req.params.id);
    const { estado } = req.body;

    if (!validarId(idDocente)) {
      return res.status(400).json({
        mensaje: "Identificador de docente inválido",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de docente inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idDocente", sql.Int, idDocente)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Docente
        SET estado = @estado
        WHERE id_docente = @idDocente;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Docente no encontrado",
      });
    }

    return res.json({
      mensaje: "Estado del docente actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar estado del docente:", error);

    return res.status(500).json({
      mensaje: "Error al cambiar el estado del docente",
      error: error.message,
    });
  }
}

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

      LEFT JOIN Docente d
        ON d.id_usuario = u.id_usuario

      WHERE r.nombre = 'Docente'
        AND u.estado = 'activo'
        AND d.id_docente IS NULL

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

module.exports = {
  listarDocentes,
  obtenerDocentePorId,
  crearDocente,
  actualizarDocente,
  cambiarEstadoDocente,
  listarUsuariosDisponibles,
};
