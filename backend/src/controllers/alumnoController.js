const { conectarBaseDeDatos, sql } = require("../config/database");

const ESTADOS_PERMITIDOS = ["activo", "inactivo", "egresado"];

const CONSULTA_ALUMNOS = `
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
`;

function validarId(id) {
  return Number.isInteger(id) && id > 0;
}

function errorServidor(res, mensaje, error) {
  console.error(mensaje, error);
  return res.status(500).json({ mensaje });
}

// LISTAR ALUMNOS
async function listarAlumnos(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      ${CONSULTA_ALUMNOS}
      ORDER BY u.apellido, u.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    return errorServidor(res, "Error al obtener los alumnos", error);
  }
}

// OBTENER ALUMNO POR ID
async function obtenerAlumnoPorId(req, res) {
  const idAlumno = Number(req.params.id);

  if (!validarId(idAlumno)) {
    return res.status(400).json({
      mensaje: "Identificador de alumno inválido",
    });
  }

  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().input("idAlumno", sql.Int, idAlumno)
      .query(`
        ${CONSULTA_ALUMNOS}
        WHERE a.id_alumno = @idAlumno
      `);

    if (!resultado.recordset.length) {
      return res.status(404).json({
        mensaje: "Alumno no encontrado",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    return errorServidor(res, "Error al obtener el alumno", error);
  }
}

// PERFIL DEL ALUMNO AUTENTICADO
async function obtenerMiPerfil(req, res) {
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
        ${CONSULTA_ALUMNOS}
        WHERE a.id_usuario = @idUsuario
      `);

    if (!resultado.recordset.length) {
      return res.status(404).json({
        mensaje: "No se encontró el perfil de alumno",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    return errorServidor(res, "Error al obtener mi perfil", error);
  }
}

// CREAR ALUMNO
async function crearAlumno(req, res) {
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

  try {
    const pool = await conectarBaseDeDatos();

    const usuario = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuarioNumero).query(`
        SELECT
          u.id_usuario,
          r.nombre AS rol
        FROM Usuario u
        INNER JOIN Rol r
          ON r.id_rol = u.id_rol
        WHERE u.id_usuario = @idUsuario
      `);

    if (!usuario.recordset.length) {
      return res.status(404).json({
        mensaje: "El usuario seleccionado no existe",
      });
    }

    if (usuario.recordset[0].rol !== "Alumno") {
      return res.status(400).json({
        mensaje: "El usuario no posee el rol Alumno",
      });
    }

    const existente = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuarioNumero).query(`
        SELECT id_alumno
        FROM Alumno
        WHERE id_usuario = @idUsuario
      `);

    if (existente.recordset.length) {
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
    return errorServidor(res, "Error al crear el alumno", error);
  }
}

// ACTUALIZAR ALUMNO
async function actualizarAlumno(req, res) {
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

  try {
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
        WHERE id_alumno = @idAlumno
      `);

    if (resultado.rowsAffected[0] === 0) {
      return res.status(404).json({
        mensaje: "Alumno no encontrado",
      });
    }

    return res.json({
      mensaje: "Alumno actualizado correctamente",
    });
  } catch (error) {
    return errorServidor(res, "Error al actualizar el alumno", error);
  }
}

// CAMBIAR ESTADO
async function cambiarEstadoAlumno(req, res) {
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

  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idAlumno", sql.Int, idAlumno)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Alumno
        SET estado = @estado
        WHERE id_alumno = @idAlumno
      `);

    if (resultado.rowsAffected[0] === 0) {
      return res.status(404).json({
        mensaje: "Alumno no encontrado",
      });
    }

    return res.json({
      mensaje: "Estado del alumno actualizado correctamente",
    });
  } catch (error) {
    return errorServidor(res, "Error al cambiar el estado", error);
  }
}

// USUARIOS DISPONIBLES PARA CREAR PERFIL
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
    return errorServidor(res, "Error al obtener usuarios disponibles", error);
  }
}

module.exports = {
  listarAlumnos,
  obtenerAlumnoPorId,
  obtenerMiPerfil,
  crearAlumno,
  actualizarAlumno,
  cambiarEstadoAlumno,
  listarUsuariosDisponibles,
};
