const { conectarBaseDeDatos, sql } = require("../config/database");

const ESTADOS_PERMITIDOS = ["planificado", "activo", "finalizado", "cancelado"];

const MODALIDADES_PERMITIDAS = ["presencial", "virtual", "mixta"];

function validarId(valor) {
  return Number.isInteger(valor) && valor > 0;
}

// LISTAR TODOS LOS CURSOS
async function listarCursos(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        c.id_curso,
        c.id_docente,
        c.nombre,
        c.nivel,
        c.descripcion,
        c.duracion_meses,
        c.modalidad,
        c.fecha_inicio,
        c.fecha_fin,
        c.cupo,
        c.estado,

        u.nombre AS docente_nombre,
        u.apellido AS docente_apellido

      FROM Curso c

      INNER JOIN Docente d
        ON d.id_docente = c.id_docente

      INNER JOIN Usuario u
        ON u.id_usuario = d.id_usuario

      ORDER BY c.fecha_inicio DESC, c.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar cursos:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los cursos",
      error: error.message,
    });
  }
}

// OBTENER UN CURSO
async function obtenerCursoPorId(req, res) {
  try {
    const idCurso = Number(req.params.id);

    if (!validarId(idCurso)) {
      return res.status(400).json({
        mensaje: "Identificador de curso inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().input("idCurso", sql.Int, idCurso)
      .query(`
        SELECT
          c.id_curso,
          c.id_docente,
          c.nombre,
          c.nivel,
          c.descripcion,
          c.duracion_meses,
          c.modalidad,
          c.fecha_inicio,
          c.fecha_fin,
          c.cupo,
          c.estado,

          u.nombre AS docente_nombre,
          u.apellido AS docente_apellido

        FROM Curso c

        INNER JOIN Docente d
          ON d.id_docente = c.id_docente

        INNER JOIN Usuario u
          ON u.id_usuario = d.id_usuario

        WHERE c.id_curso = @idCurso
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Curso no encontrado",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener curso:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el curso",
      error: error.message,
    });
  }
}

// CREAR CURSO
async function crearCurso(req, res) {
  try {
    const {
      idDocente,
      nombre,
      nivel,
      descripcion,
      duracionMeses,
      modalidad,
      fechaInicio,
      fechaFin,
      cupo,
      estado = "planificado",
    } = req.body;

    const idDocenteNumero = Number(idDocente);

    if (
      !validarId(idDocenteNumero) ||
      !nombre?.trim() ||
      !nivel?.trim() ||
      !modalidad ||
      !fechaInicio
    ) {
      return res.status(400).json({
        mensaje:
          "Docente, nombre, nivel, modalidad y fecha de inicio son obligatorios",
      });
    }

    if (!MODALIDADES_PERMITIDAS.includes(modalidad)) {
      return res.status(400).json({
        mensaje: "Modalidad de curso inválida",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de curso inválido",
      });
    }

    if (duracionMeses && Number(duracionMeses) <= 0) {
      return res.status(400).json({
        mensaje: "La duración debe ser mayor a cero",
      });
    }

    if (cupo && Number(cupo) <= 0) {
      return res.status(400).json({
        mensaje: "El cupo debe ser mayor a cero",
      });
    }

    if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
      return res.status(400).json({
        mensaje:
          "La fecha de finalización no puede ser anterior a la fecha de inicio",
      });
    }

    const pool = await conectarBaseDeDatos();

    // Verificar docente
    const docente = await pool
      .request()
      .input("idDocente", sql.Int, idDocenteNumero).query(`
        SELECT
          d.id_docente,
          d.estado
        FROM Docente d
        WHERE d.id_docente = @idDocente
      `);

    if (docente.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "El docente seleccionado no existe",
      });
    }

    if (docente.recordset[0].estado !== "activo") {
      return res.status(400).json({
        mensaje: "El docente seleccionado se encuentra inactivo",
      });
    }

    const resultado = await pool
      .request()
      .input("idDocente", sql.Int, idDocenteNumero)
      .input("nombre", sql.VarChar(100), nombre.trim())
      .input("nivel", sql.VarChar(50), nivel.trim())
      .input("descripcion", sql.VarChar(sql.MAX), descripcion?.trim() || null)
      .input(
        "duracionMeses",
        sql.Int,
        duracionMeses ? Number(duracionMeses) : null,
      )
      .input("modalidad", sql.VarChar(20), modalidad)
      .input("fechaInicio", sql.Date, fechaInicio)
      .input("fechaFin", sql.Date, fechaFin || null)
      .input("cupo", sql.Int, cupo ? Number(cupo) : null)
      .input("estado", sql.VarChar(20), estado).query(`
        INSERT INTO Curso (
          id_docente,
          nombre,
          nivel,
          descripcion,
          duracion_meses,
          modalidad,
          fecha_inicio,
          fecha_fin,
          cupo,
          estado
        )

        OUTPUT
          INSERTED.id_curso,
          INSERTED.id_docente,
          INSERTED.nombre,
          INSERTED.nivel,
          INSERTED.descripcion,
          INSERTED.duracion_meses,
          INSERTED.modalidad,
          INSERTED.fecha_inicio,
          INSERTED.fecha_fin,
          INSERTED.cupo,
          INSERTED.estado

        VALUES (
          @idDocente,
          @nombre,
          @nivel,
          @descripcion,
          @duracionMeses,
          @modalidad,
          @fechaInicio,
          @fechaFin,
          @cupo,
          @estado
        )
      `);

    return res.status(201).json({
      mensaje: "Curso creado correctamente",
      curso: resultado.recordset[0],
    });
  } catch (error) {
    console.error("Error al crear curso:", error);

    return res.status(500).json({
      mensaje: "Error al crear el curso",
      error: error.message,
    });
  }
}

// ACTUALIZAR CURSO
async function actualizarCurso(req, res) {
  try {
    const idCurso = Number(req.params.id);

    const {
      idDocente,
      nombre,
      nivel,
      descripcion,
      duracionMeses,
      modalidad,
      fechaInicio,
      fechaFin,
      cupo,
      estado,
    } = req.body;

    if (!validarId(idCurso)) {
      return res.status(400).json({
        mensaje: "Identificador de curso inválido",
      });
    }

    if (
      !validarId(Number(idDocente)) ||
      !nombre?.trim() ||
      !nivel?.trim() ||
      !modalidad ||
      !fechaInicio ||
      !estado
    ) {
      return res.status(400).json({
        mensaje: "Faltan datos obligatorios",
      });
    }

    if (!MODALIDADES_PERMITIDAS.includes(modalidad)) {
      return res.status(400).json({
        mensaje: "Modalidad de curso inválida",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de curso inválido",
      });
    }

    if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
      return res.status(400).json({
        mensaje:
          "La fecha de finalización no puede ser anterior a la fecha de inicio",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idCurso", sql.Int, idCurso)
      .input("idDocente", sql.Int, Number(idDocente))
      .input("nombre", sql.VarChar(100), nombre.trim())
      .input("nivel", sql.VarChar(50), nivel.trim())
      .input("descripcion", sql.VarChar(sql.MAX), descripcion?.trim() || null)
      .input(
        "duracionMeses",
        sql.Int,
        duracionMeses ? Number(duracionMeses) : null,
      )
      .input("modalidad", sql.VarChar(20), modalidad)
      .input("fechaInicio", sql.Date, fechaInicio)
      .input("fechaFin", sql.Date, fechaFin || null)
      .input("cupo", sql.Int, cupo ? Number(cupo) : null)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Curso

        SET
          id_docente = @idDocente,
          nombre = @nombre,
          nivel = @nivel,
          descripcion = @descripcion,
          duracion_meses = @duracionMeses,
          modalidad = @modalidad,
          fecha_inicio = @fechaInicio,
          fecha_fin = @fechaFin,
          cupo = @cupo,
          estado = @estado

        WHERE id_curso = @idCurso;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Curso no encontrado",
      });
    }

    return res.json({
      mensaje: "Curso actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar curso:", error);

    return res.status(500).json({
      mensaje: "Error al actualizar el curso",
      error: error.message,
    });
  }
}

// CAMBIAR ESTADO
async function cambiarEstadoCurso(req, res) {
  try {
    const idCurso = Number(req.params.id);
    const { estado } = req.body;

    if (!validarId(idCurso)) {
      return res.status(400).json({
        mensaje: "Identificador de curso inválido",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de curso inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idCurso", sql.Int, idCurso)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Curso
        SET estado = @estado
        WHERE id_curso = @idCurso;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Curso no encontrado",
      });
    }

    return res.json({
      mensaje: "Estado del curso actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);

    return res.status(500).json({
      mensaje: "Error al cambiar el estado del curso",
      error: error.message,
    });
  }
}

// DOCENTES PARA EL SELECT DEL FORMULARIO
async function listarDocentesActivos(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        d.id_docente,
        u.nombre,
        u.apellido,
        u.email

      FROM Docente d

      INNER JOIN Usuario u
        ON u.id_usuario = d.id_usuario

      WHERE d.estado = 'activo'
        AND u.estado = 'activo'

      ORDER BY u.apellido, u.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al obtener docentes:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los docentes",
      error: error.message,
    });
  }
}

module.exports = {
  listarCursos,
  obtenerCursoPorId,
  crearCurso,
  actualizarCurso,
  cambiarEstadoCurso,
  listarDocentesActivos,
};
