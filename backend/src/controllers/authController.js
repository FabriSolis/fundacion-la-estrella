const bcrypt = require("bcrypt");
const { conectarBaseDeDatos, sql } = require("../config/database");
const { generarToken } = require("../services/tokenService");

async function registrarAdministrador(req, res) {
  try {
    const { nombre, apellido, dni, telefono, email, contrasena } = req.body;

    if (!nombre || !apellido || !dni || !email || !contrasena) {
      return res.status(400).json({
        mensaje: "Faltan datos obligatorios",
      });
    }

    const pool = await conectarBaseDeDatos();

    const usuarioExistente = await pool
      .request()
      .input("dni", sql.VarChar(15), dni)
      .input("email", sql.VarChar(100), email).query(`
        SELECT id_usuario
        FROM Usuario
        WHERE dni = @dni OR email = @email
      `);

    if (usuarioExistente.recordset.length > 0) {
      return res.status(409).json({
        mensaje: "Ya existe un usuario con ese DNI o correo electrónico",
      });
    }

    const rolAdministrador = await pool.request().query(`
        SELECT id_rol
        FROM Rol
        WHERE nombre = 'Administrador'
      `);

    if (rolAdministrador.recordset.length === 0) {
      return res.status(500).json({
        mensaje: "No se encontró el rol Administrador",
      });
    }

    const idRol = rolAdministrador.recordset[0].id_rol;
    const contrasenaHash = await bcrypt.hash(contrasena, 12);

    const resultado = await pool
      .request()
      .input("idRol", sql.Int, idRol)
      .input("nombre", sql.VarChar(50), nombre)
      .input("apellido", sql.VarChar(50), apellido)
      .input("dni", sql.VarChar(15), dni)
      .input("telefono", sql.VarChar(30), telefono || null)
      .input("email", sql.VarChar(100), email)
      .input("contrasena", sql.VarChar(255), contrasenaHash).query(`
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
          'activo'
        )
      `);

    return res.status(201).json({
      mensaje: "Administrador registrado correctamente",
      usuario: resultado.recordset[0],
    });
  } catch (error) {
    console.error("Error al registrar administrador:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
      error: error.message,
    });
  }
}

async function iniciarSesion(req, res) {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({
        mensaje: "El correo y la contraseña son obligatorios",
      });
    }

    const pool = await conectarBaseDeDatos();

    const resultado = await pool
      .request()
      .input("email", sql.VarChar(100), email).query(`
        SELECT
          u.id_usuario,
          u.id_rol,
          u.nombre,
          u.apellido,
          u.email,
          u.contrasena,
          u.estado,
          r.nombre AS rol
        FROM Usuario u
        INNER JOIN Rol r
          ON r.id_rol = u.id_rol
        WHERE u.email = @email
      `);

    if (resultado.recordset.length === 0) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas",
      });
    }

    const usuario = resultado.recordset[0];

    if (usuario.estado !== "activo") {
      return res.status(403).json({
        mensaje: "El usuario no se encuentra activo",
      });
    }

    const contrasenaValida = await bcrypt.compare(
      contrasena,
      usuario.contrasena,
    );

    if (!contrasenaValida) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas",
      });
    }

    const token = generarToken(usuario);

    return res.json({
      mensaje: "Inicio de sesión correcto",
      token,
      usuario: {
        idUsuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
      error: error.message,
    });
  }
}

module.exports = {
  registrarAdministrador,
  iniciarSesion,
};
