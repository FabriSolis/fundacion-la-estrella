const { conectarBaseDeDatos, sql } = require("../config/database");

const ESTADOS_PERMITIDOS = [
  "pendiente",
  "confirmada",
  "en curso",
  "finalizada",
  "cancelada",
];

const CONSULTA_INSCRIPCIONES = `
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
  INNER JOIN Alumno a ON a.id_alumno = i.id_alumno
  INNER JOIN Usuario u ON u.id_usuario = a.id_usuario
  INNER JOIN Curso c ON c.id_curso = i.id_curso
`;

function validarId(valor) {
  return Number.isInteger(valor) && valor > 0;
}

function errorServidor(res, mensaje, error) {
  console.error(mensaje, error);
  return res.status(500).json({ mensaje });
}

async function listarInscripciones(req, res) {
  try {
    const pool = await conectarBaseDeDatos();
    const resultado = await pool.request().query(`
      ${CONSULTA_INSCRIPCIONES}
      ORDER BY i.fecha_inscripcion DESC, u.apellido, u.nombre
    `);
    return res.json(resultado.recordset);
  } catch (error) {
    return errorServidor(res, "Error al obtener las inscripciones", error);
  }
}

async function obtenerInscripcionPorId(req, res) {
  const idInscripcion = Number(req.params.id);

  if (!validarId(idInscripcion)) {
    return res
      .status(400)
      .json({ mensaje: "Identificador de inscripción inválido" });
  }

  try {
    const pool = await conectarBaseDeDatos();
    const resultado = await pool
      .request()
      .input("idInscripcion", sql.Int, idInscripcion)
      .query(
        `${CONSULTA_INSCRIPCIONES} WHERE i.id_inscripcion = @idInscripcion`,
      );

    if (!resultado.recordset.length) {
      return res.status(404).json({ mensaje: "Inscripción no encontrada" });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    return errorServidor(res, "Error al obtener la inscripción", error);
  }
}

// Devuelve únicamente los cursos del alumno autenticado.
async function listarMisCursos(req, res) {
  const idUsuario = Number(req.usuario?.idUsuario);

  if (!validarId(idUsuario)) {
    return res.status(401).json({ mensaje: "Usuario autenticado inválido" });
  }

  try {
    const pool = await conectarBaseDeDatos();
    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario).query(`
        SELECT
          i.id_inscripcion,
          i.fecha_inscripcion,
          i.estado,
          c.id_curso,
          c.nombre AS curso_nombre,
          c.nivel AS curso_nivel,
          c.modalidad AS curso_modalidad,
          c.fecha_inicio,
          c.fecha_fin
        FROM Inscripcion i
        INNER JOIN Alumno a ON a.id_alumno = i.id_alumno
        INNER JOIN Curso c ON c.id_curso = i.id_curso
        WHERE a.id_usuario = @idUsuario
        ORDER BY i.fecha_inscripcion DESC
      `);

    return res.json(resultado.recordset);
  } catch (error) {
    return errorServidor(res, "Error al obtener mis cursos", error);
  }
}

async function crearInscripcion(req, res) {
  const {
    idAlumno,
    idCurso,
    fechaInscripcion,
    estado = "pendiente",
  } = req.body;
  const idAlumnoNumero = Number(idAlumno);
  const idCursoNumero = Number(idCurso);

  if (!validarId(idAlumnoNumero) || !validarId(idCursoNumero)) {
    return res.status(400).json({ mensaje: "Alumno y curso son obligatorios" });
  }

  if (!ESTADOS_PERMITIDOS.includes(estado)) {
    return res.status(400).json({ mensaje: "Estado de inscripción inválido" });
  }

  let transaccion;
  let iniciada = false;

  try {
    const pool = await conectarBaseDeDatos();
    transaccion = new sql.Transaction(pool);
    await transaccion.begin();
    iniciada = true;

    const rechazar = async (codigo, mensaje) => {
      await transaccion.rollback();
      iniciada = false;
      return res.status(codigo).json({ mensaje });
    };

    const alumno = await new sql.Request(transaccion)
      .input("idAlumno", sql.Int, idAlumnoNumero)
      .query(
        "SELECT id_alumno, estado FROM Alumno WHERE id_alumno = @idAlumno",
      );

    if (!alumno.recordset.length) {
      return await rechazar(404, "El alumno seleccionado no existe");
    }
    if (alumno.recordset[0].estado !== "activo") {
      return await rechazar(
        400,
        "El alumno seleccionado no se encuentra activo",
      );
    }

    const curso = await new sql.Request(transaccion)
      .input("idCurso", sql.Int, idCursoNumero)
      .query(
        "SELECT id_curso, nombre, cupo, estado FROM Curso WHERE id_curso = @idCurso",
      );

    if (!curso.recordset.length) {
      return await rechazar(404, "El curso seleccionado no existe");
    }
    if (["cancelado", "finalizado"].includes(curso.recordset[0].estado)) {
      return await rechazar(
        400,
        "No se pueden registrar inscripciones en un curso cancelado o finalizado",
      );
    }

    const existente = await new sql.Request(transaccion)
      .input("idAlumno", sql.Int, idAlumnoNumero)
      .input("idCurso", sql.Int, idCursoNumero).query(`
        SELECT id_inscripcion FROM Inscripcion
        WHERE id_alumno = @idAlumno
          AND id_curso = @idCurso
          AND estado <> 'cancelada'
      `);

    if (existente.recordset.length) {
      return await rechazar(
        409,
        "El alumno ya se encuentra inscripto en este curso",
      );
    }

    if (curso.recordset[0].cupo !== null) {
      const cantidad = await new sql.Request(transaccion).input(
        "idCurso",
        sql.Int,
        idCursoNumero,
      ).query(`
          SELECT COUNT(*) AS cantidad FROM Inscripcion
          WHERE id_curso = @idCurso AND estado <> 'cancelada'
        `);

      if (cantidad.recordset[0].cantidad >= curso.recordset[0].cupo) {
        return await rechazar(409, "El curso no posee cupos disponibles");
      }
    }

    const resultado = await new sql.Request(transaccion)
      .input("idAlumno", sql.Int, idAlumnoNumero)
      .input("idCurso", sql.Int, idCursoNumero)
      .input("fechaInscripcion", sql.Date, fechaInscripcion || new Date())
      .input("estado", sql.VarChar(20), estado).query(`
        INSERT INTO Inscripcion (id_alumno, id_curso, fecha_inscripcion, estado)
        OUTPUT INSERTED.id_inscripcion, INSERTED.id_alumno,
               INSERTED.id_curso, INSERTED.fecha_inscripcion, INSERTED.estado
        VALUES (@idAlumno, @idCurso, @fechaInscripcion, @estado)
      `);

    await transaccion.commit();
    iniciada = false;

    return res.status(201).json({
      mensaje: "Inscripción registrada correctamente",
      inscripcion: resultado.recordset[0],
    });
  } catch (error) {
    if (iniciada) {
      try {
        await transaccion.rollback();
      } catch (rollbackError) {
        console.error("Error al revertir la transacción:", rollbackError);
      }
    }
    return errorServidor(res, "Error al registrar la inscripción", error);
  }
}

async function cambiarEstadoInscripcion(req, res) {
  const idInscripcion = Number(req.params.id);
  const { estado } = req.body;

  if (!validarId(idInscripcion)) {
    return res
      .status(400)
      .json({ mensaje: "Identificador de inscripción inválido" });
  }
  if (!ESTADOS_PERMITIDOS.includes(estado)) {
    return res.status(400).json({ mensaje: "Estado de inscripción inválido" });
  }

  try {
    const pool = await conectarBaseDeDatos();
    const resultado = await pool
      .request()
      .input("idInscripcion", sql.Int, idInscripcion)
      .input("estado", sql.VarChar(20), estado)
      .query(
        "UPDATE Inscripcion SET estado = @estado WHERE id_inscripcion = @idInscripcion",
      );

    if (resultado.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Inscripción no encontrada" });
    }
    return res.json({
      mensaje: "Estado de la inscripción actualizado correctamente",
    });
  } catch (error) {
    return errorServidor(
      res,
      "Error al cambiar el estado de la inscripción",
      error,
    );
  }
}

async function listarAlumnosActivos(req, res) {
  try {
    const pool = await conectarBaseDeDatos();
    const resultado = await pool.request().query(`
      SELECT a.id_alumno, u.nombre, u.apellido, u.dni, u.email
      FROM Alumno a
      INNER JOIN Usuario u ON u.id_usuario = a.id_usuario
      WHERE a.estado = 'activo' AND u.estado = 'activo'
      ORDER BY u.apellido, u.nombre
    `);
    return res.json(resultado.recordset);
  } catch (error) {
    return errorServidor(res, "Error al obtener los alumnos", error);
  }
}

async function listarCursosDisponibles(req, res) {
  try {
    const pool = await conectarBaseDeDatos();
    const resultado = await pool.request().query(`
      SELECT c.id_curso, c.nombre, c.nivel, c.modalidad,
             c.fecha_inicio, c.cupo, c.estado
      FROM Curso c
      WHERE c.estado IN ('planificado', 'activo')
      ORDER BY c.fecha_inicio, c.nombre
    `);
    return res.json(resultado.recordset);
  } catch (error) {
    return errorServidor(res, "Error al obtener los cursos disponibles", error);
  }
}

module.exports = {
  listarInscripciones,
  obtenerInscripcionPorId,
  listarMisCursos,
  crearInscripcion,
  cambiarEstadoInscripcion,
  listarAlumnosActivos,
  listarCursosDisponibles,
};
