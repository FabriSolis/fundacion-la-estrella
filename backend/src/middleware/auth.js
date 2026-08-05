const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  const encabezado = req.headers.authorization;

  if (!encabezado) {
    return res.status(401).json({
      mensaje: "Token no proporcionado",
    });
  }

  const partes = encabezado.split(" ");

  if (partes.length !== 2 || partes[0] !== "Bearer") {
    return res.status(401).json({
      mensaje: "Formato de token inválido",
    });
  }

  const token = partes[1];

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = datos;
    next();
  } catch {
    return res.status(401).json({
      mensaje: "Token inválido o vencido",
    });
  }
}

module.exports = {
  verificarToken,
};
