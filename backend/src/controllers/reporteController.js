const { conectarBaseDeDatos, sql } = require("../config/database");

async function obtenerResumenGeneral(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        (SELECT COUNT(*)
         FROM Paciente
         WHERE estado = 'activo') AS pacientes_activos,

        (SELECT COUNT(*)
         FROM Alumno
         WHERE estado = 'activo') AS alumnos_activos,

        (SELECT COUNT(*)
         FROM Terapeuta
         WHERE estado = 'activo') AS terapeutas_activos,

        (SELECT COUNT(*)
         FROM Docente
         WHERE estado = 'activo') AS docentes_activos,

        (SELECT COUNT(*)
         FROM Curso
         WHERE estado = 'activo') AS cursos_activos,

        (SELECT COUNT(*)
         FROM Turno
         WHERE estado = 'confirmado') AS turnos_confirmados,

        (SELECT COUNT(*)
         FROM Inscripcion
         WHERE estado IN ('confirmada', 'en curso'))
         AS inscripciones_activas,

        (SELECT COUNT(*)
         FROM Clase
         WHERE estado = 'programada')
         AS clases_programadas,

        (
          SELECT ISNULL(SUM(monto), 0)
          FROM Pago
          WHERE estado = 'registrado'
        ) AS ingresos_totales
    `);

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener resumen general:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el resumen general",
      error: error.message,
    });
  }
}

async function obtenerPagosPorMes(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        YEAR(fecha_pago) AS anio,
        MONTH(fecha_pago) AS mes,
        COUNT(*) AS cantidad_pagos,
        SUM(monto) AS total

      FROM Pago

      WHERE estado = 'registrado'

      GROUP BY
        YEAR(fecha_pago),
        MONTH(fecha_pago)

      ORDER BY
        anio DESC,
        mes DESC
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al obtener pagos por mes:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los pagos por mes",
      error: error.message,
    });
  }
}

async function obtenerTurnosPorEstado(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        estado,
        COUNT(*) AS cantidad

      FROM Turno

      GROUP BY estado

      ORDER BY cantidad DESC
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al obtener turnos por estado:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los turnos por estado",
      error: error.message,
    });
  }
}

async function obtenerInscripcionesPorCurso(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        c.id_curso,
        c.nombre,
        c.nivel,
        c.estado,
        COUNT(i.id_inscripcion) AS cantidad_inscriptos

      FROM Curso c

      LEFT JOIN Inscripcion i
        ON i.id_curso = c.id_curso
        AND i.estado <> 'cancelada'

      GROUP BY
        c.id_curso,
        c.nombre,
        c.nivel,
        c.estado

      ORDER BY cantidad_inscriptos DESC, c.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al obtener inscripciones por curso:", error);

    return res.status(500).json({
      mensaje: "Error al obtener las inscripciones por curso",
      error: error.message,
    });
  }
}

async function obtenerAsistenciaPorCurso(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        c.id_curso,
        c.nombre,
        c.nivel,

        COUNT(a.id_asistencia) AS total_registros,

        SUM(
          CASE
            WHEN a.estado_asistencia = 'presente'
            THEN 1
            ELSE 0
          END
        ) AS presentes,

        SUM(
          CASE
            WHEN a.estado_asistencia = 'ausente'
            THEN 1
            ELSE 0
          END
        ) AS ausentes,

        SUM(
          CASE
            WHEN a.estado_asistencia = 'justificado'
            THEN 1
            ELSE 0
          END
        ) AS justificados,

        CAST(
          CASE
            WHEN COUNT(a.id_asistencia) = 0
              THEN 0
            ELSE
              SUM(
                CASE
                  WHEN a.estado_asistencia = 'presente'
                  THEN 1.0
                  ELSE 0
                END
              ) * 100.0 / COUNT(a.id_asistencia)
          END
          AS DECIMAL(5,2)
        ) AS porcentaje_asistencia

      FROM Curso c

      LEFT JOIN Clase cl
        ON cl.id_curso = c.id_curso

      LEFT JOIN Asistencia a
        ON a.id_clase = cl.id_clase

      GROUP BY
        c.id_curso,
        c.nombre,
        c.nivel

      ORDER BY c.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al obtener asistencia por curso:", error);

    return res.status(500).json({
      mensaje: "Error al obtener la asistencia por curso",
      error: error.message,
    });
  }
}

async function obtenerClasesPorCurso(req, res) {
  try {
    const idCurso = Number(req.params.idCurso);

    if (!Number.isInteger(idCurso) || idCurso <= 0) {
      return res.status(400).json({
        mensaje: "Identificador de curso inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().input("idCurso", sql.Int, idCurso)
      .query(`
        SELECT
          id_clase,
          id_curso,
          fecha,

          CONVERT(VARCHAR(5), hora_inicio, 108)
            AS hora_inicio,

          CONVERT(VARCHAR(5), hora_fin, 108)
            AS hora_fin,

          tema,
          modalidad,
          estado

        FROM Clase

        WHERE id_curso = @idCurso

        ORDER BY fecha DESC, hora_inicio DESC
      `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al obtener clases del curso:", error);

    return res.status(500).json({
      mensaje: "Error al obtener las clases del curso",
      error: error.message,
    });
  }
}

async function obtenerAsistenciaPorClase(req, res) {
  try {
    const idClase = Number(req.params.idClase);

    if (!Number.isInteger(idClase) || idClase <= 0) {
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

          CONVERT(VARCHAR(5), cl.hora_inicio, 108)
            AS hora_inicio,

          CONVERT(VARCHAR(5), cl.hora_fin, 108)
            AS hora_fin,

          cl.tema,
          cl.modalidad,
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

    const resumen = await pool.request().input("idClase", sql.Int, idClase)
      .query(`
        SELECT
          COUNT(*) AS total,

          SUM(
            CASE
              WHEN estado_asistencia = 'presente'
              THEN 1
              ELSE 0
            END
          ) AS presentes,

          SUM(
            CASE
              WHEN estado_asistencia = 'ausente'
              THEN 1
              ELSE 0
            END
          ) AS ausentes,

          SUM(
            CASE
              WHEN estado_asistencia = 'justificado'
              THEN 1
              ELSE 0
            END
          ) AS justificados,

          CAST(
            CASE
              WHEN COUNT(*) = 0
                THEN 0
              ELSE
                SUM(
                  CASE
                    WHEN estado_asistencia = 'presente'
                    THEN 1.0
                    ELSE 0
                  END
                ) * 100.0 / COUNT(*)
            END
            AS DECIMAL(5,2)
          ) AS porcentaje_asistencia

        FROM Asistencia

        WHERE id_clase = @idClase
      `);

    const detalle = await pool.request().input("idClase", sql.Int, idClase)
      .query(`
        SELECT
          a.id_asistencia,
          a.estado_asistencia,
          a.observacion,

          al.id_alumno,

          u.nombre,
          u.apellido,
          u.dni

        FROM Asistencia a

        INNER JOIN Alumno al
          ON al.id_alumno = a.id_alumno

        INNER JOIN Usuario u
          ON u.id_usuario = al.id_usuario

        WHERE a.id_clase = @idClase

        ORDER BY u.apellido, u.nombre
      `);

    return res.json({
      clase: clase.recordset[0],
      resumen: resumen.recordset[0],
      alumnos: detalle.recordset,
    });
  } catch (error) {
    console.error("Error al obtener asistencia de la clase:", error);

    return res.status(500).json({
      mensaje: "Error al obtener la asistencia de la clase",
      error: error.message,
    });
  }
}

module.exports = {
  obtenerResumenGeneral,
  obtenerPagosPorMes,
  obtenerTurnosPorEstado,
  obtenerInscripcionesPorCurso,
  obtenerAsistenciaPorCurso,
  obtenerClasesPorCurso,
  obtenerAsistenciaPorClase,
};
