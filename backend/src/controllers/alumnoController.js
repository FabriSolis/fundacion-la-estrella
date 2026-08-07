const { conectarBaseDeDatos, sql } = require("../config/database");

const ESTADOS_PERMITIDOS = ["activo", "inactivo", "egresado"];

function validarId(valor) {
  return Number.isInteger(valor) && valor > 0;
}

async function listarAlumnos(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        a.id_alumno,
        a.fecha_ingreso,
        a.estado,
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.dni,
        u.telefono,
        u.email
      FROM Alumno a
      INNER JOIN Usuario u
        ON u.id_usuario = a.id_usuario
      ORDER BY u.apellido, u.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar alumnos:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los alumnos",
      error: error.message,
    });
  }
}

async function obtenerAlumnoPorId(req, res) {
  try {
    const idAlumno = Number(req.params.id);

    if (!validarId(idAlumno)) {
      return res.status(400).json({
        mensaje: "Identificador de alumno inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().input("idAlumno", sql.Int, idAlumno)
      .query(`
        SELECT
          a.id_alumno,
          a.fecha_ingreso,
          a.estado,
          u.id_usuario,
          u.nombre,
          u.apellido,
          u.dni,
          u.telefono,
          u.email
        FROM Alumno a
        INNER JOIN Usuario u
          ON u.id_usuario = a.id_usuario
        WHERE a.id_alumno = @idAlumno
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Alumno no encontrado",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener alumno:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el alumno",
      error: error.message,
    });
  }
}

async function crearAlumno(req, res) {
  try {
    const { idUsuario, fechaIngreso, estado = "activo" } = req.body;

    const idUsuarioNumero = Number(idUsuario);

    if (!validarId(idUsuarioNumero)) {
      return res.status(400).json({
        mensaje: "El usuario asociado es obligatorio",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de alumno inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const usuario = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuarioNumero).query(`
        SELECT
          u.id_usuario,
          u.estado,
          r.nombre AS rol
        FROM Usuario u
        INNER JOIN Rol r
          ON r.id_rol = u.id_rol
        WHERE u.id_usuario = @idUsuario
      `);

    if (usuario.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "El usuario seleccionado no existe",
      });
    }

    if (usuario.recordset[0].rol !== "Alumno") {
      return res.status(400).json({
        mensaje: "El usuario seleccionado no posee el rol Alumno",
      });
    }

    const perfilExistente = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuarioNumero).query(`
        SELECT id_alumno
        FROM Alumno
        WHERE id_usuario = @idUsuario
      `);

    if (perfilExistente.recordset.length > 0) {
      return res.status(409).json({
        mensaje: "El usuario ya posee un perfil de alumno",
      });
    }

    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuarioNumero)
      .input("fechaIngreso", sql.Date, fechaIngreso || new Date())
      .input("estado", sql.VarChar(20), estado).query(`
        INSERT INTO Alumno (
          id_usuario,
          fecha_ingreso,
          estado
        )
        OUTPUT
          INSERTED.id_alumno,
          INSERTED.id_usuario,
          INSERTED.fecha_ingreso,
          INSERTED.estado
        VALUES (
          @idUsuario,
          @fechaIngreso,
          @estado
        )
      `);

    return res.status(201).json({
      mensaje: "Alumno creado correctamente",
      alumno: resultado.recordset[0],
    });
  } catch (error) {
    console.error("Error al crear alumno:", error);

    return res.status(500).json({
      mensaje: "Error al crear el alumno",
      error: error.message,
    });
  }
}

async function actualizarAlumno(req, res) {
  try {
    const idAlumno = Number(req.params.id);
    const { fechaIngreso, estado } = req.body;

    if (!validarId(idAlumno)) {
      return res.status(400).json({
        mensaje: "Identificador de alumno inválido",
      });
    }

    if (!fechaIngreso || !ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Fecha de ingreso o estado inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idAlumno", sql.Int, idAlumno)
      .input("fechaIngreso", sql.Date, fechaIngreso)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Alumno
        SET
          fecha_ingreso = @fechaIngreso,
          estado = @estado
        WHERE id_alumno = @idAlumno;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Alumno no encontrado",
      });
    }

    return res.json({
      mensaje: "Alumno actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar alumno:", error);

    return res.status(500).json({
      mensaje: "Error al actualizar el alumno",
      error: error.message,
    });
  }
}

async function cambiarEstadoAlumno(req, res) {
  try {
    const idAlumno = Number(req.params.id);
    const { estado } = req.body;

    if (!validarId(idAlumno)) {
      return res.status(400).json({
        mensaje: "Identificador de alumno inválido",
      });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de alumno inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idAlumno", sql.Int, idAlumno)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Alumno
        SET estado = @estado
        WHERE id_alumno = @idAlumno;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Alumno no encontrado",
      });
    }

    return res.json({
      mensaje: "Estado del alumno actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar estado del alumno:", error);

    return res.status(500).json({
      mensaje: "Error al cambiar el estado del alumno",
      error: error.message,
    });
  }
}

async function listarUsuariosDisponibles(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.dni,
        u.email
      FROM Usuario u
      INNER JOIN Rol r
        ON r.id_rol = u.id_rol
      LEFT JOIN Alumno a
        ON a.id_usuario = u.id_usuario
      WHERE r.nombre = 'Alumno'
        AND u.estado = 'activo'
        AND a.id_alumno IS NULL
      ORDER BY u.apellido, u.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar usuarios disponibles:", error);

    return res.status(500).json({
      mensaje: "Error al obtener usuarios disponibles",
      error: error.message,
    });
  }
}

module.exports = {
  listarAlumnos,
  obtenerAlumnoPorId,
  crearAlumno,
  actualizarAlumno,
  cambiarEstadoAlumno,
  listarUsuariosDisponibles,
};
