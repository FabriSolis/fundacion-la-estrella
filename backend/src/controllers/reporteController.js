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
        ) AS justificados

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

module.exports = {
  obtenerResumenGeneral,
  obtenerPagosPorMes,
  obtenerTurnosPorEstado,
  obtenerInscripcionesPorCurso,
  obtenerAsistenciaPorCurso,
};
