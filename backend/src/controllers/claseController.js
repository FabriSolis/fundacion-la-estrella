const { conectarBaseDeDatos, sql } = require("../config/database");

const ESTADOS_PERMITIDOS = ["programada", "dictada", "suspendida", "cancelada"];

const MODALIDADES_PERMITIDAS = ["presencial", "virtual", "mixta"];

// Consulta común para evitar repetir código
const CONSULTA_CLASES = `
  SELECT
    cl.id_clase,
    cl.id_curso,
    cl.fecha,
    CONVERT(VARCHAR(5), cl.hora_inicio, 108) AS hora_inicio,
    CONVERT(VARCHAR(5), cl.hora_fin, 108) AS hora_fin,
    cl.modalidad,
    cl.enlace_virtual,
    cl.tema,
    cl.estado,
    c.nombre AS curso_nombre,
    c.nivel AS curso_nivel
  FROM Clase cl
  INNER JOIN Curso c ON c.id_curso = cl.id_curso
`;

function validarId(valor) {
  return Number.isInteger(valor) && valor > 0;
}

function limpiarTexto(valor) {
  return typeof valor === "string" ? valor.trim() || null : null;
}

function convertirHora(hora) {
  if (typeof hora !== "string" || !/^\d{1,2}:\d{2}(:\d{2})?$/.test(hora)) {
    return null;
  }

  const [horas, minutos, segundos = 0] = hora.split(":").map(Number);

  if (horas > 23 || minutos > 59 || segundos > 59) {
    return null;
  }

  return new Date(Date.UTC(1970, 0, 1, horas, minutos, segundos));
}

// Validación compartida para crear y editar clases
function validarDatosClase(datos) {
  const idCurso = Number(datos.idCurso);

  if (
    !validarId(idCurso) ||
    !datos.fecha ||
    !datos.horaInicio ||
    !datos.horaFin ||
    !datos.modalidad ||
    !datos.estado
  ) {
    return {
      error: "Curso, fecha, horarios, modalidad y estado son obligatorios",
    };
  }

  if (!MODALIDADES_PERMITIDAS.includes(datos.modalidad)) {
    return { error: "Modalidad inválida" };
  }

  if (!ESTADOS_PERMITIDOS.includes(datos.estado)) {
    return { error: "Estado de clase inválido" };
  }

  if (datos.modalidad !== "presencial" && !limpiarTexto(datos.enlaceVirtual)) {
    return {
      error: "Debe ingresar un enlace para una clase virtual o mixta",
    };
  }

  const horaInicio = convertirHora(datos.horaInicio);
  const horaFin = convertirHora(datos.horaFin);

  if (!horaInicio || !horaFin) {
    return {
      error: "El formato de las horas es inválido",
    };
  }

  if (horaFin <= horaInicio) {
    return {
      error: "La hora de finalización debe ser posterior a la hora de inicio",
    };
  }

  return { idCurso, horaInicio, horaFin };
}

function errorServidor(res, mensaje, error) {
  console.error(mensaje, error);
  return res.status(500).json({ mensaje });
}

// ==========================================
// LISTAR TODAS LAS CLASES
// ==========================================

async function listarClases(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      ${CONSULTA_CLASES}
      ORDER BY cl.fecha DESC, cl.hora_inicio DESC
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    return errorServidor(res, "Error al obtener las clases", error);
  }
}

// ==========================================
// OBTENER CLASE POR ID
// ==========================================

async function obtenerClasePorId(req, res) {
  const idClase = Number(req.params.id);

  if (!validarId(idClase)) {
    return res.status(400).json({
      mensaje: "Identificador de clase inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().input("idClase", sql.Int, idClase)
      .query(`
        ${CONSULTA_CLASES}
        WHERE cl.id_clase = @idClase
      `);

    if (!resultado.recordset.length) {
      return res.status(404).json({
        mensaje: "Clase no encontrada",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    return errorServidor(res, "Error al obtener la clase", error);
  }
}

// ==========================================
// MIS CLASES - ALUMNO AUTENTICADO
// ==========================================

async function listarMisClases(req, res) {
  const idUsuario = Number(req.usuario?.idUsuario);

  if (!validarId(idUsuario)) {
    return res.status(401).json({
      mensaje: "Usuario autenticado inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario).query(`
        ${CONSULTA_CLASES}

        WHERE EXISTS (
          SELECT 1
          FROM Inscripcion i

          INNER JOIN Alumno a
            ON a.id_alumno = i.id_alumno

          WHERE i.id_curso = cl.id_curso
            AND a.id_usuario = @idUsuario
            AND i.estado <> 'cancelada'
        )

        ORDER BY cl.fecha DESC, cl.hora_inicio DESC
      `);

    return res.json(resultado.recordset);
  } catch (error) {
    return errorServidor(res, "Error al obtener mis clases", error);
  }
}

// ==========================================
// CREAR CLASE
// ==========================================

async function crearClase(req, res) {
  const datos = {
    ...req.body,
    estado: req.body.estado ?? "programada",
  };

  const validacion = validarDatosClase(datos);

  if (validacion.error) {
    return res.status(400).json({
      mensaje: validacion.error,
    });
  }

  const { idCurso, horaInicio, horaFin } = validacion;

  try {
    const pool = await conectarBaseDeDatos();

    // Verificar curso
    const curso = await pool.request().input("idCurso", sql.Int, idCurso)
      .query(`
        SELECT id_curso, estado
        FROM Curso
        WHERE id_curso = @idCurso
      `);

    if (!curso.recordset.length) {
      return res.status(404).json({
        mensaje: "El curso seleccionado no existe",
      });
    }

    if (["cancelado", "finalizado"].includes(curso.recordset[0].estado)) {
      return res.status(400).json({
        mensaje:
          "No se pueden agregar clases a un curso cancelado o finalizado",
      });
    }

    // Evitar superposición de horarios
    const conflicto = await pool
      .request()
      .input("idCurso", sql.Int, idCurso)
      .input("fecha", sql.Date, datos.fecha)
      .input("horaInicio", sql.Time, horaInicio)
      .input("horaFin", sql.Time, horaFin).query(`
        SELECT id_clase
        FROM Clase

        WHERE id_curso = @idCurso
          AND fecha = @fecha
          AND estado NOT IN ('cancelada', 'suspendida')
          AND @horaInicio < hora_fin
          AND @horaFin > hora_inicio
      `);

    if (conflicto.recordset.length) {
      return res.status(409).json({
        mensaje: "El curso ya posee una clase en ese rango horario",
      });
    }

    // Registrar clase
    const resultado = await pool
      .request()
      .input("idCurso", sql.Int, idCurso)
      .input("fecha", sql.Date, datos.fecha)
      .input("horaInicio", sql.Time, horaInicio)
      .input("horaFin", sql.Time, horaFin)
      .input("modalidad", sql.VarChar(20), datos.modalidad)
      .input(
        "enlaceVirtual",
        sql.VarChar(255),
        limpiarTexto(datos.enlaceVirtual),
      )
      .input("tema", sql.VarChar(150), limpiarTexto(datos.tema))
      .input("estado", sql.VarChar(20), datos.estado).query(`
        INSERT INTO Clase (
          id_curso,
          fecha,
          hora_inicio,
          hora_fin,
          modalidad,
          enlace_virtual,
          tema,
          estado
        )

        OUTPUT
          INSERTED.id_clase,
          INSERTED.id_curso,
          INSERTED.fecha,
          INSERTED.hora_inicio,
          INSERTED.hora_fin,
          INSERTED.modalidad,
          INSERTED.enlace_virtual,
          INSERTED.tema,
          INSERTED.estado

        VALUES (
          @idCurso,
          @fecha,
          @horaInicio,
          @horaFin,
          @modalidad,
          @enlaceVirtual,
          @tema,
          @estado
        )
      `);

    return res.status(201).json({
      mensaje: "Clase registrada correctamente",
      clase: resultado.recordset[0],
    });
  } catch (error) {
    return errorServidor(res, "Error al registrar la clase", error);
  }
}

// ==========================================
// ACTUALIZAR CLASE
// ==========================================

async function actualizarClase(req, res) {
  const idClase = Number(req.params.id);

  if (!validarId(idClase)) {
    return res.status(400).json({
      mensaje: "Identificador de clase inválido",
    });
  }

  const datos = req.body;
  const validacion = validarDatosClase(datos);

  if (validacion.error) {
    return res.status(400).json({
      mensaje: validacion.error,
    });
  }

  const { idCurso, horaInicio, horaFin } = validacion;

  try {
    const pool = await conectarBaseDeDatos();

    // Verificar superposición
    const conflicto = await pool
      .request()
      .input("idClase", sql.Int, idClase)
      .input("idCurso", sql.Int, idCurso)
      .input("fecha", sql.Date, datos.fecha)
      .input("horaInicio", sql.Time, horaInicio)
      .input("horaFin", sql.Time, horaFin).query(`
        SELECT id_clase
        FROM Clase

        WHERE id_clase <> @idClase
          AND id_curso = @idCurso
          AND fecha = @fecha
          AND estado NOT IN ('cancelada', 'suspendida')
          AND @horaInicio < hora_fin
          AND @horaFin > hora_inicio
      `);

    if (conflicto.recordset.length) {
      return res.status(409).json({
        mensaje: "Existe otra clase del curso en ese rango horario",
      });
    }

    // Actualizar clase
    const resultado = await pool
      .request()
      .input("idClase", sql.Int, idClase)
      .input("idCurso", sql.Int, idCurso)
      .input("fecha", sql.Date, datos.fecha)
      .input("horaInicio", sql.Time, horaInicio)
      .input("horaFin", sql.Time, horaFin)
      .input("modalidad", sql.VarChar(20), datos.modalidad)
      .input(
        "enlaceVirtual",
        sql.VarChar(255),
        limpiarTexto(datos.enlaceVirtual),
      )
      .input("tema", sql.VarChar(150), limpiarTexto(datos.tema))
      .input("estado", sql.VarChar(20), datos.estado).query(`
        UPDATE Clase

        SET
          id_curso = @idCurso,
          fecha = @fecha,
          hora_inicio = @horaInicio,
          hora_fin = @horaFin,
          modalidad = @modalidad,
          enlace_virtual = @enlaceVirtual,
          tema = @tema,
          estado = @estado

        WHERE id_clase = @idClase;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Clase no encontrada",
      });
    }

    return res.json({
      mensaje: "Clase actualizada correctamente",
    });
  } catch (error) {
    return errorServidor(res, "Error al actualizar la clase", error);
  }
}

// ==========================================
// CAMBIAR ESTADO DE CLASE
// ==========================================

async function cambiarEstadoClase(req, res) {
  const idClase = Number(req.params.id);
  const { estado } = req.body;

  if (!validarId(idClase)) {
    return res.status(400).json({
      mensaje: "Identificador de clase inválido",
    });
  }

  if (!ESTADOS_PERMITIDOS.includes(estado)) {
    return res.status(400).json({
      mensaje: "Estado de clase inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idClase", sql.Int, idClase)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Clase
        SET estado = @estado
        WHERE id_clase = @idClase;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Clase no encontrada",
      });
    }

    return res.json({
      mensaje: "Estado de la clase actualizado correctamente",
    });
  } catch (error) {
    return errorServidor(res, "Error al cambiar el estado de la clase", error);
  }
}

// ==========================================
// CURSOS DISPONIBLES PARA FORMULARIOS
// ==========================================

async function listarCursosDisponibles(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        id_curso,
        nombre,
        nivel,
        modalidad,
        estado
      FROM Curso

      WHERE estado IN ('planificado', 'activo')

      ORDER BY nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    return errorServidor(res, "Error al obtener los cursos disponibles", error);
  }
}

module.exports = {
  listarClases,
  obtenerClasePorId,
  listarMisClases,
  crearClase,
  actualizarClase,
  cambiarEstadoClase,
  listarCursosDisponibles,
};
