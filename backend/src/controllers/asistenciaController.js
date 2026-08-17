const { conectarBaseDeDatos, sql } = require("../config/database");

const ESTADOS_PERMITIDOS = ["presente", "ausente", "justificado"];

function validarId(valor) {
  return Number.isInteger(valor) && valor > 0;
}

// OBTENER ALUMNOS Y ASISTENCIAS DE UNA CLASE
async function obtenerAsistenciaClase(req, res) {
  try {
    const idClase = Number(req.params.idClase);

    if (!validarId(idClase)) {
      return res.status(400).json({
        mensaje: "Identificador de clase inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const clase = await pool.request().input("idClase", sql.Int, idClase)
      .query(`
        SELECT
          cl.id_clase,
          cl.id_curso,
          cl.fecha,
          CONVERT(VARCHAR(5), cl.hora_inicio, 108) AS hora_inicio,
          CONVERT(VARCHAR(5), cl.hora_fin, 108) AS hora_fin,
          cl.tema,
          cl.estado,
          c.nombre AS curso_nombre,
          c.nivel AS curso_nivel

        FROM Clase cl

        INNER JOIN Curso c
          ON c.id_curso = cl.id_curso

        WHERE cl.id_clase = @idClase
      `);

    if (clase.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Clase no encontrada",
      });
    }

    const idCurso = clase.recordset[0].id_curso;

    const alumnos = await pool
      .request()
      .input("idCurso", sql.Int, idCurso)
      .input("idClase", sql.Int, idClase).query(`
        SELECT
          a.id_alumno,
          u.nombre,
          u.apellido,
          u.dni,

          asi.id_asistencia,
          asi.estado_asistencia,
          asi.observacion

        FROM Inscripcion i

        INNER JOIN Alumno a
          ON a.id_alumno = i.id_alumno

        INNER JOIN Usuario u
          ON u.id_usuario = a.id_usuario

        LEFT JOIN Asistencia asi
          ON asi.id_alumno = a.id_alumno
          AND asi.id_clase = @idClase

        WHERE i.id_curso = @idCurso
          AND i.estado IN (
            'confirmada',
            'en curso',
            'finalizada'
          )

        ORDER BY u.apellido, u.nombre
      `);

    return res.json({
      clase: clase.recordset[0],
      alumnos: alumnos.recordset,
    });
  } catch (error) {
    console.error("Error al obtener asistencia de clase:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los alumnos de la clase",
      error: error.message,
    });
  }
}

// GUARDAR TODA LA ASISTENCIA DE UNA CLASE
async function guardarAsistenciaClase(req, res) {
  const pool = await conectarBaseDeDatos();
  const transaction = new sql.Transaction(pool);

  try {
    const idClase = Number(req.params.idClase);
    const { asistencias } = req.body;

    if (!validarId(idClase)) {
      return res.status(400).json({
        mensaje: "Identificador de clase inválido",
      });
    }

    if (!Array.isArray(asistencias) || asistencias.length === 0) {
      return res.status(400).json({
        mensaje: "Debe enviar al menos un registro de asistencia",
      });
    }

    for (const asistencia of asistencias) {
      if (
        !validarId(Number(asistencia.idAlumno)) ||
        !ESTADOS_PERMITIDOS.includes(asistencia.estadoAsistencia)
      ) {
        return res.status(400).json({
          mensaje: "Existe un registro de asistencia inválido",
        });
      }
    }

    await transaction.begin();

    const requestClase = new sql.Request(transaction);

    const clase = await requestClase.input("idClase", sql.Int, idClase).query(`
        SELECT
          id_clase,
          id_curso,
          estado
        FROM Clase
        WHERE id_clase = @idClase
      `);

    if (clase.recordset.length === 0) {
      await transaction.rollback();

      return res.status(404).json({
        mensaje: "Clase no encontrada",
      });
    }

    const idCurso = clase.recordset[0].id_curso;

    for (const asistencia of asistencias) {
      const idAlumno = Number(asistencia.idAlumno);

      // Verificar que el alumno pertenece al curso
      const requestAlumno = new sql.Request(transaction);

      const alumnoInscripto = await requestAlumno
        .input("idAlumno", sql.Int, idAlumno)
        .input("idCurso", sql.Int, idCurso).query(`
          SELECT id_inscripcion
          FROM Inscripcion

          WHERE id_alumno = @idAlumno
            AND id_curso = @idCurso
            AND estado IN (
              'confirmada',
              'en curso',
              'finalizada'
            )
        `);

      if (alumnoInscripto.recordset.length === 0) {
        await transaction.rollback();

        return res.status(400).json({
          mensaje: "Uno de los alumnos no se encuentra inscripto en el curso",
        });
      }

      const requestExiste = new sql.Request(transaction);

      const existente = await requestExiste
        .input("idClase", sql.Int, idClase)
        .input("idAlumno", sql.Int, idAlumno).query(`
          SELECT id_asistencia
          FROM Asistencia

          WHERE id_clase = @idClase
            AND id_alumno = @idAlumno
        `);

      if (existente.recordset.length > 0) {
        const requestActualizar = new sql.Request(transaction);

        await requestActualizar
          .input("idClase", sql.Int, idClase)
          .input("idAlumno", sql.Int, idAlumno)
          .input(
            "estadoAsistencia",
            sql.VarChar(20),
            asistencia.estadoAsistencia,
          )
          .input(
            "observacion",
            sql.VarChar(255),
            asistencia.observacion?.trim() || null,
          ).query(`
            UPDATE Asistencia

            SET
              estado_asistencia = @estadoAsistencia,
              observacion = @observacion

            WHERE id_clase = @idClase
              AND id_alumno = @idAlumno
          `);
      } else {
        const requestInsertar = new sql.Request(transaction);

        await requestInsertar
          .input("idClase", sql.Int, idClase)
          .input("idAlumno", sql.Int, idAlumno)
          .input(
            "estadoAsistencia",
            sql.VarChar(20),
            asistencia.estadoAsistencia,
          )
          .input(
            "observacion",
            sql.VarChar(255),
            asistencia.observacion?.trim() || null,
          ).query(`
            INSERT INTO Asistencia (
              id_clase,
              id_alumno,
              estado_asistencia,
              observacion
            )

            VALUES (
              @idClase,
              @idAlumno,
              @estadoAsistencia,
              @observacion
            )
          `);
      }
    }

    await transaction.commit();

    return res.json({
      mensaje: "Asistencia guardada correctamente",
    });
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error al revertir transacción:", rollbackError.message);
    }

    console.error("Error al guardar asistencia:", error);

    return res.status(500).json({
      mensaje: "Error al guardar la asistencia",
      error: error.message,
    });
  }
}

// HISTORIAL DE ASISTENCIA DE UN ALUMNO
async function obtenerAsistenciaAlumno(req, res) {
  try {
    const idAlumno = Number(req.params.idAlumno);

    if (!validarId(idAlumno)) {
      return res.status(400).json({
        mensaje: "Identificador de alumno inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().input("idAlumno", sql.Int, idAlumno)
      .query(`
        SELECT
          asi.id_asistencia,
          asi.estado_asistencia,
          asi.observacion,

          cl.id_clase,
          cl.fecha,

          CONVERT(VARCHAR(5), cl.hora_inicio, 108)
            AS hora_inicio,

          cl.tema,

          c.id_curso,
          c.nombre AS curso_nombre,
          c.nivel AS curso_nivel

        FROM Asistencia asi

        INNER JOIN Clase cl
          ON cl.id_clase = asi.id_clase

        INNER JOIN Curso c
          ON c.id_curso = cl.id_curso

        WHERE asi.id_alumno = @idAlumno

        ORDER BY cl.fecha DESC, cl.hora_inicio DESC
      `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al obtener historial de asistencia:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el historial de asistencia",
      error: error.message,
    });
  }
}

module.exports = {
  obtenerAsistenciaClase,
  guardarAsistenciaClase,
  obtenerAsistenciaAlumno,
};
