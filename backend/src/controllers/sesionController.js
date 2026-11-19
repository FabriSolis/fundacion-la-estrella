const { conectarBaseDeDatos, sql } = require("../config/database");

function validarId(valor) {
  return Number.isInteger(valor) && valor > 0;
}

function validarCampos(body) {
  return ["evolucion", "observaciones", "recomendaciones"].every(
    (campo) => body?.[campo] == null || typeof body[campo] === "string",
  );
}

function texto(valor) {
  return typeof valor === "string" ? valor.trim() || null : null;
}

function datosUsuario(req) {
  const esTerapeuta = req.usuario?.rol === "Terapeuta";
  const idUsuario = Number(req.usuario?.idUsuario);
  return { esTerapeuta, idUsuario };
}

// CONSULTAR SESIÓN POR TURNO

async function obtenerSesionPorTurno(req, res) {
  const idTurno = Number(req.params.idTurno);

  if (!validarId(idTurno)) {
    return res.status(400).json({
      mensaje: "Identificador de turno inválido",
    });
  }

  const { esTerapeuta, idUsuario } = datosUsuario(req);

  if (esTerapeuta && !validarId(idUsuario)) {
    return res.status(401).json({
      mensaje: "Usuario autenticado inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idTurno", sql.Int, idTurno)
      .input("esTerapeuta", sql.Bit, esTerapeuta)
      .input("idUsuario", sql.Int, esTerapeuta ? idUsuario : null).query(`
        SELECT st.*
        FROM SesionTerapeutica AS st
        INNER JOIN Turno AS tu
          ON tu.id_turno = st.id_turno
        INNER JOIN Terapeuta AS te
          ON te.id_terapeuta = tu.id_terapeuta
        WHERE st.id_turno = @idTurno
          AND (
            @esTerapeuta = 0
            OR te.id_usuario = @idUsuario
          )
      `);

    if (!resultado.recordset.length) {
      return res.status(404).json({
        mensaje: "El turno no tiene una sesión disponible",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener la sesión:", error);

    return res.status(500).json({
      mensaje: "Error al obtener la sesión",
    });
  }
}

// CONSULTAR HISTORIAL DE UN PACIENTE

async function obtenerHistorialPaciente(req, res) {
  const idPaciente = Number(req.params.idPaciente);

  if (!validarId(idPaciente)) {
    return res.status(400).json({
      mensaje: "Identificador de paciente inválido",
    });
  }

  const { esTerapeuta, idUsuario } = datosUsuario(req);

  if (esTerapeuta && !validarId(idUsuario)) {
    return res.status(401).json({
      mensaje: "Usuario autenticado inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idPaciente", sql.Int, idPaciente)
      .input("esTerapeuta", sql.Bit, esTerapeuta)
      .input("idUsuario", sql.Int, esTerapeuta ? idUsuario : null).query(`
        SELECT
          st.id_sesion,
          st.fecha_realizacion,
          st.evolucion,
          st.observaciones,
          st.recomendaciones,
          tu.fecha,
          CONVERT(VARCHAR(5), tu.hora, 108) AS hora,
          u.nombre,
          u.apellido
        FROM SesionTerapeutica AS st
        INNER JOIN Turno AS tu
          ON tu.id_turno = st.id_turno
        INNER JOIN Terapeuta AS te
          ON te.id_terapeuta = tu.id_terapeuta
        INNER JOIN Usuario AS u
          ON u.id_usuario = te.id_usuario
        WHERE tu.id_paciente = @idPaciente
          AND (
            @esTerapeuta = 0
            OR te.id_usuario = @idUsuario
          )
        ORDER BY st.fecha_realizacion DESC
      `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al obtener el historial:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el historial",
    });
  }
}

// REGISTRAR SESIÓN

async function crearSesion(req, res) {
  const idTurno = Number(req.body?.idTurno);

  const { evolucion, observaciones, recomendaciones } = req.body || {};

  if (!validarId(idTurno)) {
    return res.status(400).json({
      mensaje: "El turno es obligatorio y debe ser válido",
    });
  }

  if (!validarCampos(req.body)) {
    return res.status(400).json({
      mensaje: "Los campos de la sesión deben ser textos",
    });
  }

  const { esTerapeuta, idUsuario } = datosUsuario(req);

  if (esTerapeuta && !validarId(idUsuario)) {
    return res.status(401).json({
      mensaje: "Usuario autenticado inválido",
    });
  }

  let transaction;
  let iniciada = false;
  let finalizada = false;

  try {
    const pool = await conectarBaseDeDatos();

    transaction = new sql.Transaction(pool);

    await transaction.begin();
    iniciada = true;

    const turno = await new sql.Request(transaction).input(
      "idTurno",
      sql.Int,
      idTurno,
    ).query(`
        SELECT
          tu.id_turno,
          tu.estado,
          te.id_usuario AS id_usuario_terapeuta
        FROM Turno AS tu WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN Terapeuta AS te
          ON te.id_terapeuta = tu.id_terapeuta
        WHERE tu.id_turno = @idTurno
      `);

    const registro = turno.recordset[0];

    if (
      !registro ||
      (esTerapeuta && registro.id_usuario_terapeuta !== idUsuario)
    ) {
      const error = new Error("Turno no encontrado o no asignado");
      error.estadoHttp = 404;
      throw error;
    }

    if (esTerapeuta && !["confirmado", "realizado"].includes(registro.estado)) {
      const error = new Error(
        "El turno debe estar confirmado o realizado para registrar la sesión",
      );
      error.estadoHttp = 409;
      throw error;
    }

    const existe = await new sql.Request(transaction).input(
      "idTurno",
      sql.Int,
      idTurno,
    ).query(`
        SELECT id_sesion
        FROM SesionTerapeutica
        WHERE id_turno = @idTurno
      `);

    if (existe.recordset.length) {
      const error = new Error("Ese turno ya posee una sesión registrada");
      error.estadoHttp = 409;
      throw error;
    }

    const resultado = await new sql.Request(transaction)
      .input("idTurno", sql.Int, idTurno)
      .input("evolucion", sql.VarChar(sql.MAX), texto(evolucion))
      .input("observaciones", sql.VarChar(sql.MAX), texto(observaciones))
      .input("recomendaciones", sql.VarChar(sql.MAX), texto(recomendaciones))
      .query(`
        INSERT INTO SesionTerapeutica (
          id_turno,
          fecha_realizacion,
          evolucion,
          observaciones,
          recomendaciones
        )
        OUTPUT
          INSERTED.id_sesion,
          INSERTED.id_turno,
          INSERTED.fecha_realizacion,
          INSERTED.evolucion,
          INSERTED.observaciones,
          INSERTED.recomendaciones
        VALUES (
          @idTurno,
          GETDATE(),
          @evolucion,
          @observaciones,
          @recomendaciones
        )
      `);

    await new sql.Request(transaction).input("idTurno", sql.Int, idTurno)
      .query(`
        UPDATE Turno
        SET estado = 'realizado'
        WHERE id_turno = @idTurno
      `);

    await transaction.commit();
    finalizada = true;

    return res.status(201).json({
      mensaje: "Sesión registrada correctamente",
      sesion: resultado.recordset[0],
    });
  } catch (error) {
    if (iniciada && !finalizada) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error al revertir la transacción:", rollbackError);
      }
    }

    if (error.estadoHttp) {
      return res.status(error.estadoHttp).json({
        mensaje: error.message,
      });
    }

    console.error("Error al registrar la sesión:", error);

    return res.status(500).json({
      mensaje: "Error al registrar la sesión",
    });
  }
}

// ACTUALIZAR SESIÓN

async function actualizarSesion(req, res) {
  const idSesion = Number(req.params.id);

  const { evolucion, observaciones, recomendaciones } = req.body || {};

  if (!validarId(idSesion)) {
    return res.status(400).json({
      mensaje: "Identificador de sesión inválido",
    });
  }

  if (!validarCampos(req.body)) {
    return res.status(400).json({
      mensaje: "Los campos de la sesión deben ser textos",
    });
  }

  const { esTerapeuta, idUsuario } = datosUsuario(req);

  if (esTerapeuta && !validarId(idUsuario)) {
    return res.status(401).json({
      mensaje: "Usuario autenticado inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idSesion", sql.Int, idSesion)
      .input("esTerapeuta", sql.Bit, esTerapeuta)
      .input("idUsuario", sql.Int, esTerapeuta ? idUsuario : null)
      .input("evolucion", sql.VarChar(sql.MAX), texto(evolucion))
      .input("observaciones", sql.VarChar(sql.MAX), texto(observaciones))
      .input("recomendaciones", sql.VarChar(sql.MAX), texto(recomendaciones))
      .query(`
        UPDATE st
        SET
          evolucion = @evolucion,
          observaciones = @observaciones,
          recomendaciones = @recomendaciones
        OUTPUT INSERTED.id_sesion
        FROM SesionTerapeutica AS st
        INNER JOIN Turno AS tu
          ON tu.id_turno = st.id_turno
        INNER JOIN Terapeuta AS te
          ON te.id_terapeuta = tu.id_terapeuta
        WHERE st.id_sesion = @idSesion
          AND (
            @esTerapeuta = 0
            OR te.id_usuario = @idUsuario
          )
      `);

    if (!resultado.recordset.length) {
      return res.status(404).json({
        mensaje: "Sesión no encontrada o no asignada",
      });
    }

    return res.json({
      mensaje: "Sesión actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar la sesión:", error);

    return res.status(500).json({
      mensaje: "Error al actualizar la sesión",
    });
  }
}

module.exports = {
  obtenerSesionPorTurno,
  obtenerHistorialPaciente,
  crearSesion,
  actualizarSesion,
};
