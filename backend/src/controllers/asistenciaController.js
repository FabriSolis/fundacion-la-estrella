const { conectarBaseDeDatos, sql } = require("../config/database");

const ESTADOS_PERMITIDOS = ["presente", "ausente", "justificado"];

function validarId(valor) {
  return Number.isInteger(valor) && valor > 0;
}

function limpiarObservacion(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  if (typeof valor !== "string") {
    return undefined;
  }

  return valor.trim() || null;
}

function esDocente(req) {
  return req.usuario?.rol === "Docente";
}

function tienePermisoDocente(req, idUsuarioDocente) {
  if (!esDocente(req)) {
    return true;
  }

  const idUsuario = Number(req.usuario?.idUsuario);

  return validarId(idUsuario) && idUsuario === Number(idUsuarioDocente);
}

// ==========================================
// OBTENER ALUMNOS Y ASISTENCIAS DE UNA CLASE
// ==========================================

async function obtenerAsistenciaClase(req, res) {
  const idClase = Number(req.params.idClase);

  if (!validarId(idClase)) {
    return res.status(400).json({
      mensaje: "Identificador de clase inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    // Buscar la clase y su docente responsable.
    const resultadoClase = await pool
      .request()
      .input("idClase", sql.Int, idClase).query(`
        SELECT
          cl.id_clase,
          cl.id_curso,
          cl.fecha,
          CONVERT(VARCHAR(5), cl.hora_inicio, 108)
            AS hora_inicio,
          CONVERT(VARCHAR(5), cl.hora_fin, 108)
            AS hora_fin,
          cl.tema,
          cl.estado,
          c.nombre AS curso_nombre,
          c.nivel AS curso_nivel,
          d.id_usuario AS id_usuario_docente

        FROM Clase cl

        INNER JOIN Curso c
          ON c.id_curso = cl.id_curso

        LEFT JOIN Docente d
          ON d.id_docente = c.id_docente

        WHERE cl.id_clase = @idClase
      `);

    if (resultadoClase.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Clase no encontrada",
      });
    }

    const claseCompleta = resultadoClase.recordset[0];

    // Un docente solo puede consultar sus clases.
    if (!tienePermisoDocente(req, claseCompleta.id_usuario_docente)) {
      return res.status(403).json({
        mensaje: "No tenés permiso para consultar esta clase",
      });
    }

    const idCurso = claseCompleta.id_curso;

    // No enviar el ID interno del usuario docente.
    const { id_usuario_docente, ...datosClase } = claseCompleta;

    // Obtener los alumnos inscriptos y su asistencia.
    const resultadoAlumnos = await pool
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
      clase: datosClase,
      alumnos: resultadoAlumnos.recordset,
    });
  } catch (error) {
    console.error("Error al obtener asistencia de clase:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los alumnos de la clase",
    });
  }
}

// ==========================================
// GUARDAR TODA LA ASISTENCIA DE UNA CLASE
// ==========================================

async function guardarAsistenciaClase(req, res) {
  const idClase = Number(req.params.idClase);
  const { asistencias } = req.body || {};

  // Validar la clase.
  if (!validarId(idClase)) {
    return res.status(400).json({
      mensaje: "Identificador de clase inválido",
    });
  }

  // Validar que existan registros.
  if (!Array.isArray(asistencias) || asistencias.length === 0) {
    return res.status(400).json({
      mensaje: "Debe enviar al menos un registro de asistencia",
    });
  }

  // Validar los datos antes de abrir la transacción.
  const alumnosRecibidos = new Set();

  for (const asistencia of asistencias) {
    const idAlumno = Number(asistencia?.idAlumno);

    if (
      !validarId(idAlumno) ||
      !ESTADOS_PERMITIDOS.includes(asistencia?.estadoAsistencia)
    ) {
      return res.status(400).json({
        mensaje: "Existe un registro de asistencia inválido",
      });
    }

    // Evitar alumnos repetidos.
    if (alumnosRecibidos.has(idAlumno)) {
      return res.status(400).json({
        mensaje: "Un alumno aparece más de una vez en la asistencia",
      });
    }

    alumnosRecibidos.add(idAlumno);

    // Validar la observación.
    const observacion = limpiarObservacion(asistencia.observacion);

    if (
      observacion === undefined ||
      (observacion && observacion.length > 255)
    ) {
      return res.status(400).json({
        mensaje: "La observación debe ser un texto de hasta 255 caracteres",
      });
    }
  }

  let transaction;
  let transaccionActiva = false;

  try {
    const pool = await conectarBaseDeDatos();

    transaction = new sql.Transaction(pool);

    await transaction.begin();
    transaccionActiva = true;

    // ======================================
    // VERIFICAR CLASE Y DOCENTE
    // ======================================

    const requestClase = new sql.Request(transaction);

    const resultadoClase = await requestClase.input("idClase", sql.Int, idClase)
      .query(`
        SELECT
          cl.id_clase,
          cl.id_curso,
          cl.estado,
          d.id_usuario AS id_usuario_docente

        FROM Clase cl

        INNER JOIN Curso c
          ON c.id_curso = cl.id_curso

        LEFT JOIN Docente d
          ON d.id_docente = c.id_docente

        WHERE cl.id_clase = @idClase
      `);

    if (resultadoClase.recordset.length === 0) {
      await transaction.rollback();
      transaccionActiva = false;

      return res.status(404).json({
        mensaje: "Clase no encontrada",
      });
    }

    const clase = resultadoClase.recordset[0];

    // Comprobar que el docente sea responsable.
    if (!tienePermisoDocente(req, clase.id_usuario_docente)) {
      await transaction.rollback();
      transaccionActiva = false;

      return res.status(403).json({
        mensaje: "No tenés permiso para registrar asistencia en esta clase",
      });
    }

    const idCurso = clase.id_curso;

    // ======================================
    // PROCESAR ASISTENCIAS
    // ======================================

    for (const asistencia of asistencias) {
      const idAlumno = Number(asistencia.idAlumno);

      const observacion = limpiarObservacion(asistencia.observacion);

      // Verificar que el alumno pertenezca al curso.
      const requestAlumno = new sql.Request(transaction);

      const alumnoInscripto = await requestAlumno
        .input("idAlumno", sql.Int, idAlumno)
        .input("idCurso", sql.Int, idCurso).query(`
          SELECT TOP 1
            id_inscripcion

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
        transaccionActiva = false;

        return res.status(400).json({
          mensaje: "Uno de los alumnos no se encuentra inscripto en el curso",
        });
      }

      // Comprobar si ya tiene asistencia registrada.
      const requestExiste = new sql.Request(transaction);

      const existente = await requestExiste
        .input("idClase", sql.Int, idClase)
        .input("idAlumno", sql.Int, idAlumno).query(`
          SELECT id_asistencia

          FROM Asistencia

          WHERE id_clase = @idClase
            AND id_alumno = @idAlumno
        `);

      // ====================================
      // ACTUALIZAR ASISTENCIA EXISTENTE
      // ====================================

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
          .input("observacion", sql.VarChar(255), observacion).query(`
            UPDATE Asistencia

            SET
              estado_asistencia = @estadoAsistencia,
              observacion = @observacion

            WHERE id_clase = @idClase
              AND id_alumno = @idAlumno
          `);
      } else {
        // ==================================
        // INSERTAR ASISTENCIA NUEVA
        // ==================================

        const requestInsertar = new sql.Request(transaction);

        await requestInsertar
          .input("idClase", sql.Int, idClase)
          .input("idAlumno", sql.Int, idAlumno)
          .input(
            "estadoAsistencia",
            sql.VarChar(20),
            asistencia.estadoAsistencia,
          )
          .input("observacion", sql.VarChar(255), observacion).query(`
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

    // Confirmar todos los cambios.
    await transaction.commit();
    transaccionActiva = false;

    return res.json({
      mensaje: "Asistencia guardada correctamente",
    });
  } catch (error) {
    // Revertir cambios si ocurrió un error.
    if (transaccionActiva && transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error al revertir transacción:", rollbackError);
      }
    }

    console.error("Error al guardar asistencia:", error);

    return res.status(500).json({
      mensaje: "Error al guardar la asistencia",
    });
  }
}

// ==========================================
// HISTORIAL DE ASISTENCIA DE UN ALUMNO
// ==========================================

async function obtenerAsistenciaAlumno(req, res) {
  const idAlumno = Number(req.params.idAlumno);

  if (!validarId(idAlumno)) {
    return res.status(400).json({
      mensaje: "Identificador de alumno inválido",
    });
  }

  try {
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
    });
  }
}

// ==========================================
// EXPORTAR FUNCIONES
// ==========================================

module.exports = {
  obtenerAsistenciaClase,
  guardarAsistenciaClase,
  obtenerAsistenciaAlumno,
};
