const { conectarBaseDeDatos, sql } = require("../config/database");

async function obtenerSesionPorTurno(req, res) {
  try {
    const idTurno = Number(req.params.idTurno);

    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().input("idTurno", sql.Int, idTurno)
      .query(`
        SELECT *
        FROM SesionTerapeutica
        WHERE id_turno = @idTurno
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "El turno aún no posee una sesión registrada",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al obtener la sesión",
      error: error.message,
    });
  }
}

async function obtenerHistorialPaciente(req, res) {
  try {
    const idPaciente = Number(req.params.idPaciente);

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idPaciente", sql.Int, idPaciente).query(`
        SELECT
            st.id_sesion,
            st.fecha_realizacion,
            st.evolucion,
            st.observaciones,
            st.recomendaciones,

            t.fecha,
            t.hora,

            u.nombre,
            u.apellido

        FROM SesionTerapeutica st

        INNER JOIN Turno t
            ON st.id_turno = t.id_turno

        INNER JOIN Terapeuta te
            ON te.id_terapeuta = t.id_terapeuta

        INNER JOIN Usuario u
            ON u.id_usuario = te.id_usuario

        WHERE t.id_paciente = @idPaciente

        ORDER BY st.fecha_realizacion DESC
      `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al obtener el historial",
      error: error.message,
    });
  }
}

async function crearSesion(req, res) {
  const pool = await conectarBaseDeDatos();
  const transaction = new sql.Transaction(pool);

  try {
    const { idTurno, evolucion, observaciones, recomendaciones } = req.body;

    if (!idTurno) {
      return res.status(400).json({
        mensaje: "El turno es obligatorio",
      });
    }

    await transaction.begin();

    const requestTurno = new sql.Request(transaction);

    const turno = await requestTurno.input("idTurno", sql.Int, Number(idTurno))
      .query(`
        SELECT id_turno
        FROM Turno
        WHERE id_turno = @idTurno
      `);

    if (turno.recordset.length === 0) {
      await transaction.rollback();

      return res.status(404).json({
        mensaje: "El turno no existe",
      });
    }

    const requestExiste = new sql.Request(transaction);

    const existe = await requestExiste.input(
      "idTurno",
      sql.Int,
      Number(idTurno),
    ).query(`
        SELECT id_sesion
        FROM SesionTerapeutica
        WHERE id_turno = @idTurno
      `);

    if (existe.recordset.length > 0) {
      await transaction.rollback();

      return res.status(409).json({
        mensaje: "Ese turno ya posee una sesión registrada",
      });
    }

    const requestInsertar = new sql.Request(transaction);

    const resultado = await requestInsertar
      .input("idTurno", sql.Int, Number(idTurno))
      .input("evolucion", sql.VarChar(sql.MAX), evolucion || null)
      .input("observaciones", sql.VarChar(sql.MAX), observaciones || null)
      .input("recomendaciones", sql.VarChar(sql.MAX), recomendaciones || null)
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

    const requestActualizar = new sql.Request(transaction);

    await requestActualizar
      .input("estado", sql.VarChar(20), "realizado")
      .input("idTurno", sql.Int, Number(idTurno)).query(`
        UPDATE Turno
        SET estado = @estado
        WHERE id_turno = @idTurno
      `);

    await transaction.commit();

    return res.status(201).json({
      mensaje: "Sesión registrada correctamente",
      sesion: resultado.recordset[0],
    });
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error al revertir la transacción:", rollbackError.message);
    }

    console.error("Error al registrar la sesión:", error);

    return res.status(500).json({
      mensaje: "Error al registrar la sesión",
      error: error.message,
    });
  }
}

async function actualizarSesion(req, res) {
  try {
    const idSesion = Number(req.params.id);

    const { evolucion, observaciones, recomendaciones } = req.body;

    const pool = await conectarBaseDeDatos();

    await pool
      .request()
      .input("idSesion", sql.Int, idSesion)
      .input("evolucion", sql.VarChar(sql.MAX), evolucion)
      .input("observaciones", sql.VarChar(sql.MAX), observaciones)
      .input("recomendaciones", sql.VarChar(sql.MAX), recomendaciones).query(`
        UPDATE SesionTerapeutica

        SET

            evolucion=@evolucion,

            observaciones=@observaciones,

            recomendaciones=@recomendaciones

        WHERE id_sesion=@idSesion
      `);

    return res.json({
      mensaje: "Sesión actualizada correctamente",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al actualizar la sesión",

      error: error.message,
    });
  }
}

module.exports = {
  obtenerSesionPorTurno,

  obtenerHistorialPaciente,

  crearSesion,

  actualizarSesion,
};
