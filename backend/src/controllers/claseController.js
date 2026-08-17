const { conectarBaseDeDatos, sql } = require("../config/database");

const ESTADOS_PERMITIDOS = ["programada", "dictada", "suspendida", "cancelada"];

const MODALIDADES_PERMITIDAS = ["presencial", "virtual", "mixta"];

function validarId(valor) {
  return Number.isInteger(valor) && valor > 0;
}

function convertirHora(hora) {
  if (typeof hora !== "string") {
    return null;
  }

  const partes = hora.split(":");

  if (partes.length < 2) {
    return null;
  }

  const horas = Number(partes[0]);
  const minutos = Number(partes[1]);
  const segundos = partes[2] ? Number(partes[2]) : 0;

  if (
    !Number.isInteger(horas) ||
    !Number.isInteger(minutos) ||
    !Number.isInteger(segundos) ||
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59 ||
    segundos < 0 ||
    segundos > 59
  ) {
    return null;
  }

  return new Date(Date.UTC(1970, 0, 1, horas, minutos, segundos, 0));
}

// LISTAR CLASES
async function listarClases(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        cl.id_clase,
        cl.id_curso,
        cl.fecha,

        CONVERT(VARCHAR(5), cl.hora_inicio, 108)
          AS hora_inicio,

        CONVERT(VARCHAR(5), cl.hora_fin, 108)
          AS hora_fin,

        cl.modalidad,
        cl.enlace_virtual,
        cl.tema,
        cl.estado,

        c.nombre AS curso_nombre,
        c.nivel AS curso_nivel

      FROM Clase cl

      INNER JOIN Curso c
        ON c.id_curso = cl.id_curso

      ORDER BY cl.fecha DESC, cl.hora_inicio DESC
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar clases:", error);

    return res.status(500).json({
      mensaje: "Error al obtener las clases",
      error: error.message,
    });
  }
}

// OBTENER CLASE POR ID
async function obtenerClasePorId(req, res) {
  try {
    const idClase = Number(req.params.id);

    if (!validarId(idClase)) {
      return res.status(400).json({
        mensaje: "Identificador de clase inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().input("idClase", sql.Int, idClase)
      .query(`
        SELECT
          cl.id_clase,
          cl.id_curso,
          cl.fecha,

          CONVERT(VARCHAR(5), cl.hora_inicio, 108)
            AS hora_inicio,

          CONVERT(VARCHAR(5), cl.hora_fin, 108)
            AS hora_fin,

          cl.modalidad,
          cl.enlace_virtual,
          cl.tema,
          cl.estado,

          c.nombre AS curso_nombre,
          c.nivel AS curso_nivel

        FROM Clase cl

        INNER JOIN Curso c
          ON c.id_curso = cl.id_curso

        WHERE cl.id_clase = @idClase
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Clase no encontrada",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener clase:", error);

    return res.status(500).json({
      mensaje: "Error al obtener la clase",
      error: error.message,
    });
  }
}

// CREAR CLASE
async function crearClase(req, res) {
  try {
    const {
      idCurso,
      fecha,
      horaInicio,
      horaFin,
      modalidad,
      enlaceVirtual,
      tema,
      estado = "programada",
    } = req.body;

    const idCursoNumero = Number(idCurso);

    if (
      !validarId(idCursoNumero) ||
      !fecha ||
      !horaInicio ||
      !horaFin ||
      !modalidad
    ) {
      return res.status(400).json({
        mensaje:
          "Curso, fecha, hora de inicio, hora de fin y modalidad son obligatorios",
      });
    }

    if (!MODALIDADES_PERMITIDAS.includes(modalidad)) {
      return res.status(400).json({
        mensaje: "Modalidad inválida",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de clase inválido",
      });
    }

    if (modalidad !== "presencial" && !enlaceVirtual?.trim()) {
      return res.status(400).json({
        mensaje: "Debe ingresar un enlace para una clase virtual o mixta",
      });
    }

    const horaInicioConvertida = convertirHora(horaInicio);
    const horaFinConvertida = convertirHora(horaFin);

    if (!horaInicioConvertida || !horaFinConvertida) {
      return res.status(400).json({
        mensaje: "El formato de las horas es inválido",
      });
    }

    if (horaFin <= horaInicio) {
      return res.status(400).json({
        mensaje:
          "La hora de finalización debe ser posterior a la hora de inicio",
      });
    }

    const pool = await conectarBaseDeDatos();

    // Verificar curso
    const curso = await pool.request().input("idCurso", sql.Int, idCursoNumero)
      .query(`
        SELECT
          id_curso,
          estado
        FROM Curso
        WHERE id_curso = @idCurso
      `);

    if (curso.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "El curso seleccionado no existe",
      });
    }

    if (
      curso.recordset[0].estado === "cancelado" ||
      curso.recordset[0].estado === "finalizado"
    ) {
      return res.status(400).json({
        mensaje:
          "No se pueden agregar clases a un curso cancelado o finalizado",
      });
    }

    // Evitar clases superpuestas dentro del mismo curso
    const conflicto = await pool
      .request()
      .input("idCurso", sql.Int, idCursoNumero)
      .input("fecha", sql.Date, fecha)
      .input("horaInicio", sql.Time, horaInicioConvertida)
      .input("horaFin", sql.Time, horaFinConvertida).query(`
        SELECT id_clase
        FROM Clase

        WHERE id_curso = @idCurso
          AND fecha = @fecha
          AND estado NOT IN ('cancelada', 'suspendida')

          AND (
            @horaInicio < hora_fin
            AND @horaFin > hora_inicio
          )
      `);

    if (conflicto.recordset.length > 0) {
      return res.status(409).json({
        mensaje: "El curso ya posee una clase en ese rango horario",
      });
    }

    const resultado = await pool
      .request()
      .input("idCurso", sql.Int, idCursoNumero)
      .input("fecha", sql.Date, fecha)
      .input("horaInicio", sql.Time, horaInicioConvertida)
      .input("horaFin", sql.Time, horaFinConvertida)
      .input("modalidad", sql.VarChar(20), modalidad)
      .input("enlaceVirtual", sql.VarChar(255), enlaceVirtual?.trim() || null)
      .input("tema", sql.VarChar(150), tema?.trim() || null)
      .input("estado", sql.VarChar(20), estado).query(`
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
    console.error("Error al crear clase:", error);

    return res.status(500).json({
      mensaje: "Error al registrar la clase",
      error: error.message,
    });
  }
}

// ACTUALIZAR CLASE
async function actualizarClase(req, res) {
  try {
    const idClase = Number(req.params.id);

    const {
      idCurso,
      fecha,
      horaInicio,
      horaFin,
      modalidad,
      enlaceVirtual,
      tema,
      estado,
    } = req.body;

    if (!validarId(idClase)) {
      return res.status(400).json({
        mensaje: "Identificador de clase inválido",
      });
    }

    if (
      !validarId(Number(idCurso)) ||
      !fecha ||
      !horaInicio ||
      !horaFin ||
      !modalidad ||
      !estado
    ) {
      return res.status(400).json({
        mensaje: "Faltan datos obligatorios",
      });
    }

    if (!MODALIDADES_PERMITIDAS.includes(modalidad)) {
      return res.status(400).json({
        mensaje: "Modalidad inválida",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de clase inválido",
      });
    }

    const horaInicioConvertida = convertirHora(horaInicio);
    const horaFinConvertida = convertirHora(horaFin);

    if (!horaInicioConvertida || !horaFinConvertida) {
      return res.status(400).json({
        mensaje: "Formato de hora inválido",
      });
    }

    if (horaFin <= horaInicio) {
      return res.status(400).json({
        mensaje:
          "La hora de finalización debe ser posterior a la hora de inicio",
      });
    }

    const pool = await conectarBaseDeDatos();

    const conflicto = await pool
      .request()
      .input("idClase", sql.Int, idClase)
      .input("idCurso", sql.Int, Number(idCurso))
      .input("fecha", sql.Date, fecha)
      .input("horaInicio", sql.Time, horaInicioConvertida)
      .input("horaFin", sql.Time, horaFinConvertida).query(`
        SELECT id_clase

        FROM Clase

        WHERE id_clase <> @idClase
          AND id_curso = @idCurso
          AND fecha = @fecha
          AND estado NOT IN ('cancelada', 'suspendida')

          AND (
            @horaInicio < hora_fin
            AND @horaFin > hora_inicio
          )
      `);

    if (conflicto.recordset.length > 0) {
      return res.status(409).json({
        mensaje: "Existe otra clase del curso en ese rango horario",
      });
    }

    const resultado = await pool
      .request()
      .input("idClase", sql.Int, idClase)
      .input("idCurso", sql.Int, Number(idCurso))
      .input("fecha", sql.Date, fecha)
      .input("horaInicio", sql.Time, horaInicioConvertida)
      .input("horaFin", sql.Time, horaFinConvertida)
      .input("modalidad", sql.VarChar(20), modalidad)
      .input("enlaceVirtual", sql.VarChar(255), enlaceVirtual?.trim() || null)
      .input("tema", sql.VarChar(150), tema?.trim() || null)
      .input("estado", sql.VarChar(20), estado).query(`
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
    console.error("Error al actualizar clase:", error);

    return res.status(500).json({
      mensaje: "Error al actualizar la clase",
      error: error.message,
    });
  }
}

// CAMBIAR ESTADO
async function cambiarEstadoClase(req, res) {
  try {
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
    console.error("Error al cambiar estado de clase:", error);

    return res.status(500).json({
      mensaje: "Error al cambiar el estado de la clase",
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
    return res.status(500).json({
      mensaje: "Error al obtener los cursos disponibles",
      error: error.message,
    });
  }
}

module.exports = {
  listarClases,
  obtenerClasePorId,
  crearClase,
  actualizarClase,
  cambiarEstadoClase,
  listarCursosDisponibles,
};
