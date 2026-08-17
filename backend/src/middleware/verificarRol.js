function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    console.log("USUARIO DEL TOKEN:", req.usuario);
    console.log("ROL DEL TOKEN:", req.usuario?.rol);
    console.log("ROLES PERMITIDOS:", rolesPermitidos);

    if (!req.usuario) {
      return res.status(401).json({
        mensaje: "Usuario no autenticado",
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        mensaje: "No tiene permisos para realizar esta acción",
      });
    }

    next();
  };
}

module.exports = {
  verificarRol,
};
