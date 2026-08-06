const { conectarBaseDeDatos, sql } = require("../config/database");

async function listarPacientes(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        p.id_paciente,
        p.fecha_alta,
        p.motivo_consulta,
        p.estado,
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.dni,
        u.telefono,
        u.email
      FROM Paciente p
      INNER JOIN Usuario u
        ON u.id_usuario = p.id_usuario
      ORDER BY u.apellido, u.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar pacientes:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los pacientes",
      error: error.message,
    });
  }
}

async function obtenerPacientePorId(req, res) {
  try {
    const idPaciente = Number(req.params.id);

    if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
      return res.status(400).json({
        mensaje: "Identificador de paciente inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idPaciente", sql.Int, idPaciente).query(`
        SELECT
          p.id_paciente,
          p.fecha_alta,
          p.motivo_consulta,
          p.estado,
          u.id_usuario,
          u.nombre,
          u.apellido,
          u.dni,
          u.telefono,
          u.email
        FROM Paciente p
        INNER JOIN Usuario u
          ON u.id_usuario = p.id_usuario
        WHERE p.id_paciente = @idPaciente
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener paciente:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el paciente",
      error: error.message,
    });
  }
}

async function crearPaciente(req, res) {
  try {
    const {
      idUsuario,
      fechaAlta,
      motivoConsulta,
      estado = "activo",
    } = req.body;

    if (!idUsuario) {
      return res.status(400).json({
        mensaje: "El usuario asociado es obligatorio",
      });
    }

    const estadosPermitidos = ["activo", "inactivo"];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de paciente inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const usuario = await pool.request().input("idUsuario", sql.Int, idUsuario)
      .query(`
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

    if (usuario.recordset[0].rol !== "Paciente") {
      return res.status(400).json({
        mensaje: "El usuario seleccionado no posee el rol Paciente",
      });
    }

    const perfilExistente = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario).query(`
        SELECT id_paciente
        FROM Paciente
        WHERE id_usuario = @idUsuario
      `);

    if (perfilExistente.recordset.length > 0) {
      return res.status(409).json({
        mensaje: "El usuario ya posee un perfil de paciente",
      });
    }

    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario)
      .input(
        "fechaAlta",
        sql.Date,
        fechaAlta ? new Date(fechaAlta) : new Date(),
      )
      .input("motivoConsulta", sql.VarChar(255), motivoConsulta || null)
      .input("estado", sql.VarChar(20), estado).query(`
        INSERT INTO Paciente (
          id_usuario,
          fecha_alta,
          motivo_consulta,
          estado
        )
        OUTPUT
          INSERTED.id_paciente,
          INSERTED.id_usuario,
          INSERTED.fecha_alta,
          INSERTED.motivo_consulta,
          INSERTED.estado
        VALUES (
          @idUsuario,
          @fechaAlta,
          @motivoConsulta,
          @estado
        )
      `);

    return res.status(201).json({
      mensaje: "Paciente creado correctamente",
      paciente: resultado.recordset[0],
    });
  } catch (error) {
    console.error("Error al crear paciente:", error);

    return res.status(500).json({
      mensaje: "Error al crear el paciente",
      error: error.message,
    });
  }
}

async function actualizarPaciente(req, res) {
  try {
    const idPaciente = Number(req.params.id);
    const { fechaAlta, motivoConsulta, estado } = req.body;

    if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
      return res.status(400).json({
        mensaje: "Identificador de paciente inválido",
      });
    }

    const estadosPermitidos = ["activo", "inactivo"];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de paciente inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idPaciente", sql.Int, idPaciente)
      .input("fechaAlta", sql.Date, fechaAlta ? new Date(fechaAlta) : null)
      .input("motivoConsulta", sql.VarChar(255), motivoConsulta || null)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Paciente
        SET
          fecha_alta = COALESCE(@fechaAlta, fecha_alta),
          motivo_consulta = @motivoConsulta,
          estado = @estado
        WHERE id_paciente = @idPaciente;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado",
      });
    }

    return res.json({
      mensaje: "Paciente actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar paciente:", error);

    return res.status(500).json({
      mensaje: "Error al actualizar el paciente",
      error: error.message,
    });
  }
}

async function cambiarEstadoPaciente(req, res) {
  try {
    const idPaciente = Number(req.params.id);
    const { estado } = req.body;

    if (!Number.isInteger(idPaciente) || idPaciente <= 0) {
      return res.status(400).json({
        mensaje: "Identificador de paciente inválido",
      });
    }

    const estadosPermitidos = ["activo", "inactivo"];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de paciente inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idPaciente", sql.Int, idPaciente)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Paciente
        SET estado = @estado
        WHERE id_paciente = @idPaciente;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Paciente no encontrado",
      });
    }

    return res.json({
      mensaje: "Estado del paciente actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar estado del paciente:", error);

    return res.status(500).json({
      mensaje: "Error al cambiar el estado del paciente",
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
      LEFT JOIN Paciente p
        ON p.id_usuario = u.id_usuario
      WHERE r.nombre = 'Paciente'
        AND u.estado = 'activo'
        AND p.id_paciente IS NULL
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
  listarPacientes,
  obtenerPacientePorId,
  crearPaciente,
  actualizarPaciente,
  cambiarEstadoPaciente,
  listarUsuariosDisponibles,
};
