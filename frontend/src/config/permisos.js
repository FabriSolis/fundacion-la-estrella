export const ROLES = {
  ADMIN: "administrador",
  ASISTENTE: "asistente administrativo",
  DOCENTE: "docente",
  TERAPEUTA: "terapeuta",
  ALUMNO: "alumno",
  PACIENTE: "paciente",
};

const rolesPorId = {
  1: ROLES.ADMIN,
  2: ROLES.ASISTENTE,
  3: ROLES.DOCENTE,
  4: ROLES.TERAPEUTA,
  5: ROLES.ALUMNO,
  6: ROLES.PACIENTE,
};

export function obtenerUsuario() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch {
    return null;
  }
}

export function obtenerRol() {
  const usuario = obtenerUsuario();

  const valor =
    usuario?.rol?.nombre_rol ??
    usuario?.rol?.nombre ??
    usuario?.rol ??
    usuario?.nombre_rol ??
    usuario?.id_rol;

  const rol = String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (rol === "asistente") {
    return ROLES.ASISTENTE;
  }

  return rolesPorId[rol] || rol;
}

export function rutaInicial() {
  return obtenerRol() === ROLES.ADMIN ? "/dashboard" : "/mi-panel";
}
