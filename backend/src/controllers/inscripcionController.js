const { conectarBaseDeDatos, sql } = require("../config/database");

const ESTADOS_PERMITIDOS = [
  "pendiente",
  "confirmada",
  "en curso",
  "finalizada",
  "cancelada",
];

function validarId(valor) {
  return Number.isInteger(valor) && valor > 0;
}

// LISTAR INSCRIPCIONES
async function listarInscripciones(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        i.id_inscripcion,
        i.id_alumno,
        i.id_curso,
        i.fecha_inscripcion,
        i.estado,

        u.nombre AS alumno_nombre,
        u.apellido AS alumno_apellido,
        u.dni AS alumno_dni,
        u.email AS alumno_email,

        c.nombre AS curso_nombre,
        c.nivel AS curso_nivel,
        c.modalidad AS curso_modalidad,
        c.fecha_inicio,
        c.fecha_fin

      FROM Inscripcion i

      INNER JOIN Alumno a
        ON a.id_alumno = i.id_alumno

      INNER JOIN Usuario u
        ON u.id_usuario = a.id_usuario

      INNER JOIN Curso c
        ON c.id_curso = i.id_curso

      ORDER BY i.fecha_inscripcion DESC, u.apellido, u.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar inscripciones:", error);

    return res.status(500).json({
      mensaje: "Error al obtener las inscripciones",
      error: error.message,
    });
  }
}

// OBTENER UNA INSCRIPCION
async function obtenerInscripcionPorId(req, res) {
  try {
    const idInscripcion = Number(req.params.id);

    if (!validarId(idInscripcion)) {
      return res.status(400).json({
        mensaje: "Identificador de inscripción inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idInscripcion", sql.Int, idInscripcion).query(`
        SELECT
          i.id_inscripcion,
          i.id_alumno,
          i.id_curso,
          i.fecha_inscripcion,
          i.estado,

          u.nombre AS alumno_nombre,
          u.apellido AS alumno_apellido,

          c.nombre AS curso_nombre,
          c.nivel AS curso_nivel

        FROM Inscripcion i

        INNER JOIN Alumno a
          ON a.id_alumno = i.id_alumno

        INNER JOIN Usuario u
          ON u.id_usuario = a.id_usuario

        INNER JOIN Curso c
          ON c.id_curso = i.id_curso

        WHERE i.id_inscripcion = @idInscripcion
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Inscripción no encontrada",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener inscripción:", error);

    return res.status(500).json({
      mensaje: "Error al obtener la inscripción",
      error: error.message,
    });
  }
}

// CREAR INSCRIPCION
async function crearInscripcion(req, res) {
  const pool = await conectarBaseDeDatos();
  const transaction = new sql.Transaction(pool);

  try {
    const {
      idAlumno,
      idCurso,
      fechaInscripcion,
      estado = "pendiente",
    } = req.body;

    const idAlumnoNumero = Number(idAlumno);
    const idCursoNumero = Number(idCurso);

    if (!validarId(idAlumnoNumero) || !validarId(idCursoNumero)) {
      return res.status(400).json({
        mensaje: "Alumno y curso son obligatorios",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de inscripción inválido",
      });
    }

    await transaction.begin();

    // 1. Verificar alumno
    const requestAlumno = new sql.Request(transaction);

    const alumno = await requestAlumno.input(
      "idAlumno",
      sql.Int,
      idAlumnoNumero,
    ).query(`
        SELECT
          a.id_alumno,
          a.estado
        FROM Alumno a
        WHERE a.id_alumno = @idAlumno
      `);

    if (alumno.recordset.length === 0) {
      await transaction.rollback();

      return res.status(404).json({
        mensaje: "El alumno seleccionado no existe",
      });
    }

    if (alumno.recordset[0].estado !== "activo") {
      await transaction.rollback();

      return res.status(400).json({
        mensaje: "El alumno seleccionado no se encuentra activo",
      });
    }

    // 2. Verificar curso
    const requestCurso = new sql.Request(transaction);

    const curso = await requestCurso.input("idCurso", sql.Int, idCursoNumero)
      .query(`
        SELECT
          id_curso,
          nombre,
          cupo,
          estado
        FROM Curso
        WHERE id_curso = @idCurso
      `);

    if (curso.recordset.length === 0) {
      await transaction.rollback();

      return res.status(404).json({
        mensaje: "El curso seleccionado no existe",
      });
    }

    if (
      curso.recordset[0].estado === "cancelado" ||
      curso.recordset[0].estado === "finalizado"
    ) {
      await transaction.rollback();

      return res.status(400).json({
        mensaje:
          "No se pueden registrar inscripciones en un curso cancelado o finalizado",
      });
    }

    // 3. Evitar inscripción duplicada
    const requestExistente = new sql.Request(transaction);

    const existente = await requestExistente
      .input("idAlumno", sql.Int, idAlumnoNumero)
      .input("idCurso", sql.Int, idCursoNumero).query(`
        SELECT
          id_inscripcion,
          estado
        FROM Inscripcion
        WHERE id_alumno = @idAlumno
          AND id_curso = @idCurso
          AND estado <> 'cancelada'
      `);

    if (existente.recordset.length > 0) {
      await transaction.rollback();

      return res.status(409).json({
        mensaje: "El alumno ya se encuentra inscripto en este curso",
      });
    }

    // 4. Controlar cupo
    if (curso.recordset[0].cupo !== null) {
      const requestCupo = new sql.Request(transaction);

      const cantidad = await requestCupo.input(
        "idCurso",
        sql.Int,
        idCursoNumero,
      ).query(`
          SELECT COUNT(*) AS cantidad
          FROM Inscripcion
          WHERE id_curso = @idCurso
            AND estado <> 'cancelada'
        `);

      if (cantidad.recordset[0].cantidad >= curso.recordset[0].cupo) {
        await transaction.rollback();

        return res.status(409).json({
          mensaje: "El curso no posee cupos disponibles",
        });
      }
    }

    // 5. Registrar inscripción
    const requestInsertar = new sql.Request(transaction);

    const resultado = await requestInsertar
      .input("idAlumno", sql.Int, idAlumnoNumero)
      .input("idCurso", sql.Int, idCursoNumero)
      .input("fechaInscripcion", sql.Date, fechaInscripcion || new Date())
      .input("estado", sql.VarChar(20), estado).query(`
        INSERT INTO Inscripcion (
          id_alumno,
          id_curso,
          fecha_inscripcion,
          estado
        )

        OUTPUT
          INSERTED.id_inscripcion,
          INSERTED.id_alumno,
          INSERTED.id_curso,
          INSERTED.fecha_inscripcion,
          INSERTED.estado

        VALUES (
          @idAlumno,
          @idCurso,
          @fechaInscripcion,
          @estado
        )
      `);

    await transaction.commit();

    return res.status(201).json({
      mensaje: "Inscripción registrada correctamente",
      inscripcion: resultado.recordset[0],
    });
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error al revertir transacción:", rollbackError.message);
    }

    console.error("Error al crear inscripción:", error);

    return res.status(500).json({
      mensaje: "Error al registrar la inscripción",
      error: error.message,
    });
  }
}

// ACTUALIZAR ESTADO
async function cambiarEstadoInscripcion(req, res) {
  try {
    const idInscripcion = Number(req.params.id);
    const { estado } = req.body;

    if (!validarId(idInscripcion)) {
      return res.status(400).json({
        mensaje: "Identificador de inscripción inválido",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de inscripción inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idInscripcion", sql.Int, idInscripcion)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Inscripcion
        SET estado = @estado
        WHERE id_inscripcion = @idInscripcion;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Inscripción no encontrada",
      });
    }

    return res.json({
      mensaje: "Estado de la inscripción actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar estado de inscripción:", error);

    return res.status(500).json({
      mensaje: "Error al cambiar el estado de la inscripción",
      error: error.message,
    });
  }
}

// ALUMNOS DISPONIBLES PARA EL FORMULARIO
async function listarAlumnosActivos(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        a.id_alumno,
        u.nombre,
        u.apellido,
        u.dni,
        u.email
      FROM Alumno a
      INNER JOIN Usuario u
        ON u.id_usuario = a.id_usuario
      WHERE a.estado = 'activo'
        AND u.estado = 'activo'
      ORDER BY u.apellido, u.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener los alumnos",
      error: error.message,
    });
  }
}

// CURSOS DISPONIBLES PARA EL FORMULARIO
async function listarCursosDisponibles(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        c.id_curso,
        c.nombre,
        c.nivel,
        c.modalidad,
        c.fecha_inicio,
        c.cupo,
        c.estado
      FROM Curso c
      WHERE c.estado IN ('planificado', 'activo')
      ORDER BY c.fecha_inicio, c.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al obtener los cursos disponibles",
      error: error.message,
    });
  }
}

module.exports = {
  listarInscripciones,
  obtenerInscripcionPorId,
  crearInscripcion,
  cambiarEstadoInscripcion,
  listarAlumnosActivos,
  listarCursosDisponibles,
};
