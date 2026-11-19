const { conectarBaseDeDatos, sql } = require("../config/database");

const ESTADOS_PERMITIDOS = [
  "solicitado",
  "confirmado",
  "realizado",
  "cancelado",
  "reprogramado",
  "ausente",
];

const MODALIDADES_PERMITIDAS = ["presencial", "virtual"];

function validarId(valor) {
  return Number.isInteger(valor) && valor > 0;
}

function convertirHora(hora) {
  if (typeof hora !== "string") return null;

  const partes = hora.split(":");
  if (partes.length < 2 || partes.length > 3) return null;

  const horas = Number(partes[0]);
  const minutos = Number(partes[1]);
  const segundos = partes[2] ? Number(partes[2]) : 0;

  if (
    !Number.isInteger(horas) ||
    horas < 0 ||
    horas > 23 ||
    !Number.isInteger(minutos) ||
    minutos < 0 ||
    minutos > 59 ||
    !Number.isInteger(segundos) ||
    segundos < 0 ||
    segundos > 59
  )
    return null;

  return new Date(Date.UTC(1970, 0, 1, horas, minutos, segundos));
}

// LISTAR TODOS LOS TURNOS - ADMINISTRACIÓN

async function listarTurnos(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        tu.id_turno, tu.fecha,
        CONVERT(VARCHAR(5), tu.hora, 108) AS hora,
        tu.modalidad, tu.estado,
        tu.motivo_consulta, tu.observacion,
        p.id_paciente,
        up.nombre AS paciente_nombre,
        up.apellido AS paciente_apellido,
        up.dni AS paciente_dni,
        t.id_terapeuta,
        ut.nombre AS terapeuta_nombre,
        ut.apellido AS terapeuta_apellido,
        t.especialidad AS terapeuta_especialidad
      FROM Turno tu
      INNER JOIN Paciente p ON p.id_paciente = tu.id_paciente
      INNER JOIN Usuario up ON up.id_usuario = p.id_usuario
      INNER JOIN Terapeuta t ON t.id_terapeuta = tu.id_terapeuta
      INNER JOIN Usuario ut ON ut.id_usuario = t.id_usuario
      ORDER BY tu.fecha DESC, tu.hora DESC
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar turnos:", error);
    return res.status(500).json({
      mensaje: "Error al obtener los turnos",
      error: error.message,
    });
  }
}

// LISTAR MIS TURNOS - TERAPEUTA

async function listarMisTurnosTerapeuta(req, res) {
  if (req.usuario?.rol !== "Terapeuta") {
    return res.status(403).json({
      mensaje: "No tenés permiso para consultar estos turnos",
    });
  }

  const idUsuario = Number(req.usuario?.idUsuario);

  if (!validarId(idUsuario)) {
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
          tu.id_turno, tu.fecha,
          CONVERT(VARCHAR(5), tu.hora, 108) AS hora,
          tu.modalidad, tu.estado,
          tu.motivo_consulta, tu.observacion,
          p.id_paciente,
          up.nombre AS paciente_nombre,
          up.apellido AS paciente_apellido,
          up.dni AS paciente_dni,
          t.id_terapeuta,
          ut.nombre AS terapeuta_nombre,
          ut.apellido AS terapeuta_apellido,
          t.especialidad AS terapeuta_especialidad
        FROM Turno tu
        INNER JOIN Paciente p ON p.id_paciente = tu.id_paciente
        INNER JOIN Usuario up ON up.id_usuario = p.id_usuario
        INNER JOIN Terapeuta t ON t.id_terapeuta = tu.id_terapeuta
        INNER JOIN Usuario ut ON ut.id_usuario = t.id_usuario
        WHERE t.id_usuario = @idUsuario
        ORDER BY tu.fecha DESC, tu.hora DESC
      `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar mis turnos:", error);
    return res.status(500).json({
      mensaje: "Error al obtener mis turnos",
    });
  }
}

// OBTENER TURNO POR ID

async function obtenerTurnoPorId(req, res) {
  const idTurno = Number(req.params.id);

  if (!validarId(idTurno)) {
    return res.status(400).json({
      mensaje: "Identificador de turno inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().input("idTurno", sql.Int, idTurno)
      .query(`
        SELECT
          tu.id_turno, tu.id_paciente, tu.id_terapeuta,
          tu.fecha,
          CONVERT(VARCHAR(5), tu.hora, 108) AS hora,
          tu.modalidad, tu.estado,
          tu.motivo_consulta, tu.observacion,
          up.nombre AS paciente_nombre,
          up.apellido AS paciente_apellido,
          ut.nombre AS terapeuta_nombre,
          ut.apellido AS terapeuta_apellido
        FROM Turno tu
        INNER JOIN Paciente p ON p.id_paciente = tu.id_paciente
        INNER JOIN Usuario up ON up.id_usuario = p.id_usuario
        INNER JOIN Terapeuta t ON t.id_terapeuta = tu.id_terapeuta
        INNER JOIN Usuario ut ON ut.id_usuario = t.id_usuario
        WHERE tu.id_turno = @idTurno
      `);

    if (!resultado.recordset.length) {
      return res.status(404).json({
        mensaje: "Turno no encontrado",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener turno:", error);
    return res.status(500).json({
      mensaje: "Error al obtener el turno",
      error: error.message,
    });
  }
}

// CREAR TURNO

async function crearTurno(req, res) {
  try {
    const {
      idPaciente,
      idTerapeuta,
      fecha,
      hora,
      modalidad,
      estado = "solicitado",
      motivoConsulta,
      observacion,
    } = req.body;

    if (!idPaciente || !idTerapeuta || !fecha || !hora || !modalidad) {
      return res.status(400).json({
        mensaje:
          "Paciente, terapeuta, fecha, hora y modalidad son obligatorios",
      });
    }

    if (!validarId(Number(idPaciente))) {
      return res.status(400).json({ mensaje: "Paciente inválido" });
    }

    if (!validarId(Number(idTerapeuta))) {
      return res.status(400).json({ mensaje: "Terapeuta inválido" });
    }

    if (!MODALIDADES_PERMITIDAS.includes(modalidad)) {
      return res.status(400).json({ mensaje: "Modalidad inválida" });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({ mensaje: "Estado de turno inválido" });
    }

    const horaConvertida = convertirHora(hora);

    if (!horaConvertida) {
      return res.status(400).json({
        mensaje: "La hora ingresada no tiene un formato válido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const paciente = await pool
      .request()
      .input("idPaciente", sql.Int, Number(idPaciente)).query(`
        SELECT id_paciente FROM Paciente
        WHERE id_paciente = @idPaciente AND estado = 'activo'
      `);

    if (!paciente.recordset.length) {
      return res.status(404).json({
        mensaje: "El paciente no existe o está inactivo",
      });
    }

    const terapeuta = await pool
      .request()
      .input("idTerapeuta", sql.Int, Number(idTerapeuta)).query(`
        SELECT id_terapeuta FROM Terapeuta
        WHERE id_terapeuta = @idTerapeuta AND estado = 'activo'
      `);

    if (!terapeuta.recordset.length) {
      return res.status(404).json({
        mensaje: "El terapeuta no existe o está inactivo",
      });
    }

    const disponibilidad = await pool
      .request()
      .input("idPaciente", sql.Int, Number(idPaciente))
      .input("idTerapeuta", sql.Int, Number(idTerapeuta))
      .input("fecha", sql.Date, fecha)
      .input("hora", sql.Time, horaConvertida).query(`
        SELECT id_turno FROM Turno
        WHERE fecha = @fecha
          AND hora = @hora
          AND estado NOT IN ('cancelado', 'reprogramado')
          AND (
            id_paciente = @idPaciente
            OR id_terapeuta = @idTerapeuta
          )
      `);

    if (disponibilidad.recordset.length) {
      return res.status(409).json({
        mensaje: "El paciente o terapeuta ya posee un turno en ese horario",
      });
    }

    const resultado = await pool
      .request()
      .input("idPaciente", sql.Int, Number(idPaciente))
      .input("idTerapeuta", sql.Int, Number(idTerapeuta))
      .input("fecha", sql.Date, fecha)
      .input("hora", sql.Time, horaConvertida)
      .input("modalidad", sql.VarChar(20), modalidad)
      .input("estado", sql.VarChar(20), estado)
      .input("motivoConsulta", sql.VarChar(255), motivoConsulta || null)
      .input("observacion", sql.VarChar(255), observacion || null).query(`
        INSERT INTO Turno (
          id_paciente, id_terapeuta, fecha, hora,
          modalidad, estado, motivo_consulta, observacion
        )
        OUTPUT INSERTED.*
        VALUES (
          @idPaciente, @idTerapeuta, @fecha, @hora,
          @modalidad, @estado, @motivoConsulta, @observacion
        )
      `);

    return res.status(201).json({
      mensaje: "Turno registrado correctamente",
      turno: resultado.recordset[0],
    });
  } catch (error) {
    console.error("Error al crear turno:", error);

    if ([2601, 2627].includes(error.number)) {
      return res.status(409).json({
        mensaje: "El paciente o terapeuta ya tiene un turno en ese horario",
      });
    }

    return res.status(500).json({
      mensaje: "Error al registrar el turno",
      error: error.message,
    });
  }
}

// ACTUALIZAR TURNO - ADMINISTRACIÓN

async function actualizarTurno(req, res) {
  const idTurno = Number(req.params.id);

  const {
    idPaciente,
    idTerapeuta,
    fecha,
    hora,
    modalidad,
    estado,
    motivoConsulta,
    observacion,
  } = req.body;

  if (!validarId(idTurno)) {
    return res.status(400).json({
      mensaje: "Identificador de turno inválido",
    });
  }

  if (!idPaciente || !idTerapeuta || !fecha || !hora || !modalidad || !estado) {
    return res.status(400).json({
      mensaje: "Faltan datos obligatorios",
    });
  }

  if (!validarId(Number(idPaciente)) || !validarId(Number(idTerapeuta))) {
    return res.status(400).json({
      mensaje: "Paciente o terapeuta inválido",
    });
  }

  if (!MODALIDADES_PERMITIDAS.includes(modalidad)) {
    return res.status(400).json({ mensaje: "Modalidad inválida" });
  }

  if (!ESTADOS_PERMITIDOS.includes(estado)) {
    return res.status(400).json({ mensaje: "Estado de turno inválido" });
  }

  const horaConvertida = convertirHora(hora);

  if (!horaConvertida) {
    return res.status(400).json({
      mensaje: "La hora ingresada no tiene un formato válido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    const conflicto = await pool
      .request()
      .input("idTurno", sql.Int, idTurno)
      .input("idPaciente", sql.Int, Number(idPaciente))
      .input("idTerapeuta", sql.Int, Number(idTerapeuta))
      .input("fecha", sql.Date, fecha)
      .input("hora", sql.Time, horaConvertida).query(`
        SELECT id_turno FROM Turno
        WHERE id_turno <> @idTurno
          AND fecha = @fecha
          AND hora = @hora
          AND estado NOT IN ('cancelado', 'reprogramado')
          AND (
            id_paciente = @idPaciente
            OR id_terapeuta = @idTerapeuta
          )
      `);

    if (conflicto.recordset.length) {
      return res.status(409).json({
        mensaje: "El paciente o terapeuta ya posee otro turno en ese horario",
      });
    }

    const resultado = await pool
      .request()
      .input("idTurno", sql.Int, idTurno)
      .input("idPaciente", sql.Int, Number(idPaciente))
      .input("idTerapeuta", sql.Int, Number(idTerapeuta))
      .input("fecha", sql.Date, fecha)
      .input("hora", sql.Time, horaConvertida)
      .input("modalidad", sql.VarChar(20), modalidad)
      .input("estado", sql.VarChar(20), estado)
      .input("motivoConsulta", sql.VarChar(255), motivoConsulta || null)
      .input("observacion", sql.VarChar(255), observacion || null).query(`
        UPDATE Turno SET
          id_paciente = @idPaciente,
          id_terapeuta = @idTerapeuta,
          fecha = @fecha,
          hora = @hora,
          modalidad = @modalidad,
          estado = @estado,
          motivo_consulta = @motivoConsulta,
          observacion = @observacion
        WHERE id_turno = @idTurno;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (!resultado.recordset[0].filas_modificadas) {
      return res.status(404).json({
        mensaje: "Turno no encontrado",
      });
    }

    return res.json({
      mensaje: "Turno actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar turno:", error);

    if ([2601, 2627].includes(error.number)) {
      return res.status(409).json({
        mensaje: "El paciente o terapeuta ya tiene un turno en ese horario",
      });
    }

    return res.status(500).json({
      mensaje: "Error al actualizar el turno",
      error: error.message,
    });
  }
}

// CAMBIAR ESTADO - ADMINISTRADOR Y TERAPEUTA

async function cambiarEstadoTurno(req, res) {
  const idTurno = Number(req.params.id);
  const { estado } = req.body || {};
  const rol = req.usuario?.rol;

  if (!validarId(idTurno)) {
    return res.status(400).json({
      mensaje: "Identificador de turno inválido",
    });
  }

  if (!ESTADOS_PERMITIDOS.includes(estado)) {
    return res.status(400).json({
      mensaje: "Estado de turno inválido",
    });
  }

  if (
    !["Administrador", "Asistente Administrativo", "Terapeuta"].includes(rol)
  ) {
    return res.status(403).json({
      mensaje: "No tenés permiso para modificar turnos",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    if (rol === "Terapeuta") {
      const idUsuario = Number(req.usuario?.idUsuario);

      if (!validarId(idUsuario)) {
        return res.status(401).json({
          mensaje: "Usuario autenticado inválido",
        });
      }

      if (!["confirmado", "realizado", "cancelado"].includes(estado)) {
        return res.status(403).json({
          mensaje:
            "El terapeuta solo puede confirmar, realizar o cancelar sus turnos",
        });
      }

      const resultado = await pool
        .request()
        .input("idTurno", sql.Int, idTurno)
        .input("idUsuario", sql.Int, idUsuario)
        .input("estado", sql.VarChar(20), estado).query(`
          UPDATE tu
          SET estado = @estado
          OUTPUT INSERTED.id_turno, INSERTED.estado
          FROM Turno AS tu
          INNER JOIN Terapeuta AS t
            ON t.id_terapeuta = tu.id_terapeuta
          WHERE tu.id_turno = @idTurno
            AND t.id_usuario = @idUsuario
            AND (
              (
                tu.estado = 'solicitado'
                AND @estado IN ('confirmado', 'cancelado')
              )
              OR (
                tu.estado = 'confirmado'
                AND @estado IN ('realizado', 'cancelado')
              )
            )
        `);

      if (resultado.recordset.length) {
        return res.json({
          mensaje: "Estado del turno actualizado correctamente",
          turno: resultado.recordset[0],
        });
      }

      const propio = await pool
        .request()
        .input("idTurno", sql.Int, idTurno)
        .input("idUsuario", sql.Int, idUsuario).query(`
          SELECT tu.estado
          FROM Turno AS tu
          INNER JOIN Terapeuta AS t
            ON t.id_terapeuta = tu.id_terapeuta
          WHERE tu.id_turno = @idTurno
            AND t.id_usuario = @idUsuario
        `);

      if (!propio.recordset.length) {
        return res.status(404).json({
          mensaje: "Turno no encontrado o no asignado",
        });
      }

      return res.status(409).json({
        mensaje:
          "No se puede cambiar un turno " +
          propio.recordset[0].estado +
          " a " +
          estado,
      });
    }

    const resultado = await pool
      .request()
      .input("idTurno", sql.Int, idTurno)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Turno
        SET estado = @estado
        WHERE id_turno = @idTurno;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (!resultado.recordset[0].filas_modificadas) {
      return res.status(404).json({
        mensaje: "Turno no encontrado",
      });
    }

    return res.json({
      mensaje: "Estado del turno actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar estado del turno:", error);
    return res.status(500).json({
      mensaje: "Error al cambiar el estado del turno",
    });
  }
}

// OPCIONES PARA FORMULARIO DE TURNOS

async function obtenerOpcionesTurno(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const pacientes = await pool.request().query(`
      SELECT
        p.id_paciente, u.nombre, u.apellido, u.dni
      FROM Paciente p
      INNER JOIN Usuario u ON u.id_usuario = p.id_usuario
      WHERE p.estado = 'activo'
        AND u.estado = 'activo'
      ORDER BY u.apellido, u.nombre
    `);

    const terapeutas = await pool.request().query(`
      SELECT
        t.id_terapeuta, t.especialidad,
        u.nombre, u.apellido
      FROM Terapeuta t
      INNER JOIN Usuario u ON u.id_usuario = t.id_usuario
      WHERE t.estado = 'activo'
        AND u.estado = 'activo'
      ORDER BY u.apellido, u.nombre
    `);

    return res.json({
      pacientes: pacientes.recordset,
      terapeutas: terapeutas.recordset,
    });
  } catch (error) {
    console.error("Error al obtener opciones de turno:", error);
    return res.status(500).json({
      mensaje: "Error al obtener pacientes y terapeutas",
      error: error.message,
    });
  }
}

module.exports = {
  listarTurnos,
  listarMisTurnosTerapeuta,
  obtenerTurnoPorId,
  crearTurno,
  actualizarTurno,
  cambiarEstadoTurno,
  obtenerOpcionesTurno,
};
