const bcrypt = require("bcrypt");
const { conectarBaseDeDatos, sql } = require("../config/database");

async function listarUsuarios(req, res) {
  try {
    const pool = await conectarBaseDeDatos();

    const resultado = await pool.request().query(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.dni,
        u.telefono,
        u.email,
        u.estado,
        u.fecha_alta,
        r.id_rol,
        r.nombre AS rol
      FROM Usuario u
      INNER JOIN Rol r
        ON r.id_rol = u.id_rol
      ORDER BY u.apellido, u.nombre
    `);

    return res.json(resultado.recordset);
  } catch (error) {
    console.error("Error al listar usuarios:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los usuarios",
      error: error.message,
    });
  }
}

async function obtenerUsuarioPorId(req, res) {
  try {
    const idUsuario = Number(req.params.id);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(400).json({
        mensaje: "Identificador de usuario inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario).query(`
        SELECT
          u.id_usuario,
          u.nombre,
          u.apellido,
          u.dni,
          u.telefono,
          u.email,
          u.estado,
          u.fecha_alta,
          r.id_rol,
          r.nombre AS rol
        FROM Usuario u
        INNER JOIN Rol r
          ON r.id_rol = u.id_rol
        WHERE u.id_usuario = @idUsuario
      `);

    if (resultado.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    return res.json(resultado.recordset[0]);
  } catch (error) {
    console.error("Error al obtener usuario:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el usuario",
      error: error.message,
    });
  }
}

async function crearUsuario(req, res) {
  try {
    const {
      idRol,
      nombre,
      apellido,
      dni,
      telefono,
      email,
      contrasena,
      estado = "activo",
    } = req.body;

    if (!idRol || !nombre || !apellido || !dni || !email || !contrasena) {
      return res.status(400).json({
        mensaje: "Faltan datos obligatorios",
      });
    }

    const pool = await conectarBaseDeDatos();

    const existente = await pool
      .request()
      .input("dni", sql.VarChar(15), dni)
      .input("email", sql.VarChar(100), email).query(`
        SELECT id_usuario
        FROM Usuario
        WHERE dni = @dni OR email = @email
      `);

    if (existente.recordset.length > 0) {
      return res.status(409).json({
        mensaje: "Ya existe un usuario con ese DNI o correo electrónico",
      });
    }

    const rolExistente = await pool.request().input("idRol", sql.Int, idRol)
      .query(`
        SELECT id_rol
        FROM Rol
        WHERE id_rol = @idRol
      `);

    if (rolExistente.recordset.length === 0) {
      return res.status(400).json({
        mensaje: "El rol seleccionado no existe",
      });
    }

    const estadosPermitidos = ["activo", "inactivo", "bloqueado"];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado inválido",
      });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 12);

    const resultado = await pool
      .request()
      .input("idRol", sql.Int, idRol)
      .input("nombre", sql.VarChar(50), nombre)
      .input("apellido", sql.VarChar(50), apellido)
      .input("dni", sql.VarChar(15), dni)
      .input("telefono", sql.VarChar(30), telefono || null)
      .input("email", sql.VarChar(100), email)
      .input("contrasena", sql.VarChar(255), contrasenaHash)
      .input("estado", sql.VarChar(20), estado).query(`
        INSERT INTO Usuario (
          id_rol,
          nombre,
          apellido,
          dni,
          telefono,
          email,
          contrasena,
          estado
        )
        OUTPUT
          INSERTED.id_usuario,
          INSERTED.nombre,
          INSERTED.apellido,
          INSERTED.email,
          INSERTED.estado
        VALUES (
          @idRol,
          @nombre,
          @apellido,
          @dni,
          @telefono,
          @email,
          @contrasena,
          @estado
        )
      `);

    return res.status(201).json({
      mensaje: "Usuario creado correctamente",
      usuario: resultado.recordset[0],
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);

    return res.status(500).json({
      mensaje: "Error al crear el usuario",
      error: error.message,
    });
  }
}

async function actualizarUsuario(req, res) {
  try {
    const idUsuario = Number(req.params.id);

    const { idRol, nombre, apellido, dni, telefono, email, estado } = req.body;

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(400).json({
        mensaje: "Identificador de usuario inválido",
      });
    }

    if (!idRol || !nombre || !apellido || !dni || !email || !estado) {
      return res.status(400).json({
        mensaje: "Faltan datos obligatorios",
      });
    }

    const estadosPermitidos = ["activo", "inactivo", "bloqueado"];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const duplicado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario)
      .input("dni", sql.VarChar(15), dni)
      .input("email", sql.VarChar(100), email).query(`
        SELECT id_usuario
        FROM Usuario
        WHERE (dni = @dni OR email = @email)
          AND id_usuario <> @idUsuario
      `);

    if (duplicado.recordset.length > 0) {
      return res.status(409).json({
        mensaje: "Otro usuario ya utiliza ese DNI o correo electrónico",
      });
    }

    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario)
      .input("idRol", sql.Int, idRol)
      .input("nombre", sql.VarChar(50), nombre)
      .input("apellido", sql.VarChar(50), apellido)
      .input("dni", sql.VarChar(15), dni)
      .input("telefono", sql.VarChar(30), telefono || null)
      .input("email", sql.VarChar(100), email)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Usuario
        SET
          id_rol = @idRol,
          nombre = @nombre,
          apellido = @apellido,
          dni = @dni,
          telefono = @telefono,
          email = @email,
          estado = @estado
        WHERE id_usuario = @idUsuario;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    return res.json({
      mensaje: "Usuario actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);

    return res.status(500).json({
      mensaje: "Error al actualizar el usuario",
      error: error.message,
    });
  }
}

async function cambiarEstadoUsuario(req, res) {
  try {
    const idUsuario = Number(req.params.id);
    const { estado } = req.body;

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(400).json({
        mensaje: "Identificador de usuario inválido",
      });
    }

    const estadosPermitidos = ["activo", "inactivo", "bloqueado"];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado inválido",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("idUsuario", sql.Int, idUsuario)
      .input("estado", sql.VarChar(20), estado).query(`
        UPDATE Usuario
        SET estado = @estado
        WHERE id_usuario = @idUsuario;

        SELECT @@ROWCOUNT AS filas_modificadas;
      `);

    if (resultado.recordset[0].filas_modificadas === 0) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    return res.json({
      mensaje: "Estado del usuario actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);

    return res.status(500).json({
      mensaje: "Error al cambiar el estado del usuario",
      error: error.message,
    });
  }
}

module.exports = {
  listarUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
};
