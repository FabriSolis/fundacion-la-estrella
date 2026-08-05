const jwt = require("jsonwebtoken");

function generarToken(usuario) {
  return jwt.sign(
    {
      idUsuario: usuario.id_usuario,
      idRol: usuario.id_rol,
      rol: usuario.rol,
      email: usuario.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
    },
  );
}

module.exports = {
  generarToken,
};
