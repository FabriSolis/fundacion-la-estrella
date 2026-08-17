const { conectarBaseDeDatos, sql } = require("../config/database");

const ESTADOS_PERMITIDOS = [
  "registrado",
  "pendiente",
  "anulado",
  "reintegrado",
];

const MEDIOS_PERMITIDOS = ["efectivo", "transferencia", "otro"];

function validarId(valor) {
  return Number.isInteger(valor) && valor > 0;
}

async function listarPagos(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        p.id_pago,
        p.id_inscripcion,
        p.id_turno,
        p.concepto,
        p.monto,
        p.fecha_pago,
        p.medio_pago,
        p.estado,
        p.comprobante_url,
        p.observacion,

        ua.nombre AS alumno_nombre,
        ua.apellido AS alumno_apellido,
        c.nombre AS curso_nombre,

        up.nombre AS paciente_nombre,
        up.apellido AS paciente_apellido,

        t.fecha AS turno_fecha,
        CONVERT(VARCHAR(5), t.hora, 108) AS turno_hora

      FROM Pago p

      LEFT JOIN Inscripcion i
        ON i.id_inscripcion = p.id_inscripcion

      LEFT JOIN Alumno a
        ON a.id_alumno = i.id_alumno

      LEFT JOIN Usuario ua
        ON ua.id_usuario = a.id_usuario

      LEFT JOIN Curso c
        ON c.id_curso = i.id_curso

      LEFT JOIN Turno t
        ON t.id_turno = p.id_turno

      LEFT JOIN Paciente pa
        ON pa.id_paciente = t.id_paciente

      LEFT JOIN Usuario up
        ON up.id_usuario = pa.id_usuario

      ORDER BY p.fecha_pago DESC
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar pagos:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los pagos",
      error: error.message,
    });
  }
}

async function obtenerPagoPorId(req, res) {
  try {
    const idPago = Number(req.params.id);

    if (!validarId(idPago)) {
      return res.status(400).json({
        mensaje: "Identificador de pago inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().input("idPago", sql.Int, idPago)
      .query(`
        SELECT
          id_pago,
          id_inscripcion,
          id_turno,
          concepto,
          monto,
          fecha_pago,
          medio_pago,
          estado,
          comprobante_url,
          observacion

        FROM Pago

        WHERE id_pago = @idPago
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Pago no encontrado",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener pago:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el pago",
      error: error.message,
    });
  }
}

async function crearPago(req, res) {
  try {
    const {
      idInscripcion,
      idTurno,
      concepto,
      monto,
      fechaPago,
      medioPago,
      estado = "registrado",
      comprobanteUrl,
      observacion,
    } = req.body;

    const tieneInscripcion = Boolean(idInscripcion);
    const tieneTurno = Boolean(idTurno);

    if (tieneInscripcion === tieneTurno) {
      return res.status(400).json({
        mensaje:
          "El pago debe asociarse a una inscripción o a un turno, pero no a ambos",
      });
    }

    if (!concepto?.trim()) {
      return res.status(400).json({
        mensaje: "El concepto del pago es obligatorio",
      });
    }

    const montoNumero = Number(monto);

    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      return res.status(400).json({
        mensaje: "El monto debe ser mayor que cero",
      });
    }

    if (!MEDIOS_PERMITIDOS.includes(medioPago)) {
      return res.status(400).json({
        mensaje: "Medio de pago inválido",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de pago inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    if (tieneInscripcion) {
      const idInscripcionNumero = Number(idInscripcion);

      if (!validarId(idInscripcionNumero)) {
        return res.status(400).json({
          mensaje: "Inscripción inválida",
        });
      }

      const inscripcion = await pool
        .request()
        .input("idInscripcion", sql.Int, idInscripcionNumero).query(`
          SELECT id_inscripcion
          FROM Inscripcion
          WHERE id_inscripcion = @idInscripcion
        `);

      if (inscripcion.recordset.length === 0) {
        return res.status(404).json({
          mensaje: "La inscripción seleccionada no existe",
        });
      }
    }

    if (tieneTurno) {
      const idTurnoNumero = Number(idTurno);

      if (!validarId(idTurnoNumero)) {
        return res.status(400).json({
          mensaje: "Turno inválido",
        });
      }

      const turno = await pool
        .request()
        .input("idTurno", sql.Int, idTurnoNumero).query(`
          SELECT id_turno
          FROM Turno
          WHERE id_turno = @idTurno
        `);

      if (turno.recordset.length === 0) {
        return res.status(404).json({
          mensaje: "El turno seleccionado no existe",
        });
      }
    }

    const resultado = await pool
      .request()
      .input(
        "idInscripcion",
        sql.Int,
        tieneInscripcion ? Number(idInscripcion) : null,
      )
      .input("idTurno", sql.Int, tieneTurno ? Number(idTurno) : null)
      .input("concepto", sql.VarChar(100), concepto.trim())
      .input("monto", sql.Decimal(12, 2), montoNumero)
      .input(
        "fechaPago",
        sql.DateTime,
        fechaPago ? new Date(fechaPago) : new Date(),
      )
      .input("medioPago", sql.VarChar(50), medioPago)
      .input("estado", sql.VarChar(20), estado)
      .input("comprobanteUrl", sql.VarChar(255), comprobanteUrl?.trim() || null)
      .input("observacion", sql.VarChar(255), observacion?.trim() || null)
      .query(`
        INSERT INTO Pago (
          id_inscripcion,
          id_turno,
          concepto,
          monto,
          fecha_pago,
          medio_pago,
          estado,
          comprobante_url,
          observacion
        )

        OUTPUT
          INSERTED.id_pago,
          INSERTED.id_inscripcion,
          INSERTED.id_turno,
          INSERTED.concepto,
          INSERTED.monto,
          INSERTED.fecha_pago,
          INSERTED.medio_pago,
          INSERTED.estado,
          INSERTED.comprobante_url,
          INSERTED.observacion

        VALUES (
          @idInscripcion,
          @idTurno,
          @concepto,
          @monto,
          @fechaPago,
          @medioPago,
          @estado,
          @comprobanteUrl,
          @observacion
        )
      `);

    return res.status(201).json({
      mensaje: "Pago registrado correctamente",
      pago: resultado.recordset[0],
    });
  } catch (error) {
    console.error("Error al crear pago:", error);

    return res.status(500).json({
      mensaje: "Error al registrar el pago",
      error: error.message,
    });
  }
}

async function actualizarPago(req, res) {
  try {
    const idPago = Number(req.params.id);

    const {
      concepto,
      monto,
      fechaPago,
      medioPago,
      estado,
      comprobanteUrl,
      observacion,
    } = req.body;

    if (!validarId(idPago)) {
      return res.status(400).json({
        mensaje: "Identificador de pago inválido",
      });
    }

    if (!concepto?.trim()) {
      return res.status(400).json({
        mensaje: "El concepto es obligatorio",
      });
    }

    const montoNumero = Number(monto);

    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      return res.status(400).json({
        mensaje: "El monto debe ser mayor que cero",
      });
    }

    if (!MEDIOS_PERMITIDOS.includes(medioPago)) {
      return res.status(400).json({
        mensaje: "Medio de pago inválido",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de pago inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idPago", sql.Int, idPago)
      .input("concepto", sql.VarChar(100), concepto.trim())
      .input("monto", sql.Decimal(12, 2), montoNumero)
      .input(
        "fechaPago",
        sql.DateTime,
        fechaPago ? new Date(fechaPago) : new Date(),
      )
      .input("medioPago", sql.VarChar(50), medioPago)
      .input("estado", sql.VarChar(20), estado)
      .input("comprobanteUrl", sql.VarChar(255), comprobanteUrl?.trim() || null)
      .input("observacion", sql.VarChar(255), observacion?.trim() || null)
      .query(`
        UPDATE Pago

        SET
          concepto = @concepto,
          monto = @monto,
          fecha_pago = @fechaPago,
          medio_pago = @medioPago,
          estado = @estado,
          comprobante_url = @comprobanteUrl,
          observacion = @observacion

        WHERE id_pago = @idPago;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Pago no encontrado",
      });
    }

    return res.json({
      mensaje: "Pago actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar pago:", error);

    return res.status(500).json({
      mensaje: "Error al actualizar el pago",
      error: error.message,
    });
  }
}

async function cambiarEstadoPago(req, res) {
  try {
    const idPago = Number(req.params.id);
    const { estado } = req.body;

    if (!validarId(idPago)) {
      return res.status(400).json({
        mensaje: "Identificador de pago inválido",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de pago inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idPago", sql.Int, idPago)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Pago
        SET estado = @estado
        WHERE id_pago = @idPago;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Pago no encontrado",
      });
    }

    return res.json({
      mensaje: "Estado del pago actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar estado del pago:", error);

    return res.status(500).json({
      mensaje: "Error al cambiar el estado del pago",
      error: error.message,
    });
  }
}

async function obtenerOpcionesPago(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const inscripciones = await pool.request().query(`
      SELECT
        i.id_inscripcion,
        u.nombre,
        u.apellido,
        u.dni,
        c.nombre AS curso_nombre,
        c.nivel AS curso_nivel

      FROM Inscripcion i

      INNER JOIN Alumno a
        ON a.id_alumno = i.id_alumno

      INNER JOIN Usuario u
        ON u.id_usuario = a.id_usuario

      INNER JOIN Curso c
        ON c.id_curso = i.id_curso

      WHERE i.estado <> 'cancelada'

      ORDER BY u.apellido, u.nombre
    `);

    const turnos = await pool.request().query(`
      SELECT
        t.id_turno,
        t.fecha,
        CONVERT(VARCHAR(5), t.hora, 108) AS hora,
        u.nombre,
        u.apellido,
        u.dni

      FROM Turno t

      INNER JOIN Paciente p
        ON p.id_paciente = t.id_paciente

      INNER JOIN Usuario u
        ON u.id_usuario = p.id_usuario

      WHERE t.estado <> 'cancelado'

      ORDER BY t.fecha DESC, t.hora DESC
    `);

    return res.json({
      inscripciones: inscripciones.recordset,
      turnos: turnos.recordset,
    });
  } catch (error) {
    console.error("Error al obtener opciones de pago:", error);

    return res.status(500).json({
      mensaje: "Error al obtener las opciones de pago",
      error: error.message,
    });
  }
}

module.exports = {
  listarPagos,
  obtenerPagoPorId,
  crearPago,
  actualizarPago,
  cambiarEstadoPago,
  obtenerOpcionesPago,
};
