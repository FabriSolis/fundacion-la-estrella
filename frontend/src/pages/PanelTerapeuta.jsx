import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);
const FORMULARIO_VACIO = {
  evolucion: "",
  observaciones: "",
  recomendaciones: "",
};

const nombreCompleto = (nombre, apellido) =>
  [nombre, apellido].filter(Boolean).join(" ") || "—";

const fechaTexto = (valor) => {
  if (!valor) return "—";
  const [anio, mes, dia] = String(valor).slice(0, 10).split("-");
  return dia ? `${dia}/${mes}/${anio}` : "—";
};

const horaTexto = (valor) => String(valor || "").slice(0, 5) || "—";

const fechaTurno = (turno) => {
  const fecha = String(turno.fecha || "").slice(0, 10);
  const hora = String(turno.hora || "00:00").slice(0, 5);
  return new Date(`${fecha}T${hora}:00`);
};

const colorEstado = (estado) => {
  const colores = {
    activo: "success",
    confirmado: "info",
    solicitado: "warning",
    realizado: "success",
    cancelado: "error",
    reprogramado: "warning",
    ausente: "error",
  };
  return colores[String(estado || "").toLowerCase()] || "default";
};

const ACCIONES = {
  solicitado: [
    { estado: "confirmado", texto: "Confirmar", color: "primary" },
    { estado: "cancelado", texto: "Cancelar", color: "error" },
  ],
  confirmado: [
    { estado: "realizado", texto: "Marcar realizado", color: "success" },
    { estado: "cancelado", texto: "Cancelar", color: "error" },
  ],
};

async function consultar(ruta, signal, opciones = {}) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay una sesión iniciada");

  const respuesta = await fetch(`${API}${ruta}`, {
    method: opciones.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(opciones.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(opciones.body ? { body: JSON.stringify(opciones.body) } : {}),
    signal,
  });

  const tipo = respuesta.headers.get("content-type") || "";
  const datos = tipo.includes("application/json")
    ? await respuesta.json()
    : null;

  if (!respuesta.ok) {
    const error = new Error(datos?.mensaje || `Error HTTP ${respuesta.status}`);
    error.status = respuesta.status;
    throw error;
  }

  if (!datos) {
    throw new Error(
      "El servidor no devolvió JSON. Revisá la conexión con ngrok.",
    );
  }

  return datos;
}

function TablaTurnos({
  turnos,
  alCambiarEstado,
  alRegistrarSesion,
  procesando,
}) {
  if (!turnos.length) {
    return <Alert severity="info">No hay turnos para mostrar.</Alert>;
  }

  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: 820 }}>
        <TableHead>
          <TableRow>
            {[
              "Fecha",
              "Hora",
              "Paciente",
              "Modalidad",
              "Estado",
              "Acciones",
            ].map((titulo) => (
              <TableCell key={titulo}>
                <strong>{titulo}</strong>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {turnos.map((turno) => {
            const estadoActual = String(turno.estado || "").toLowerCase();
            const acciones = ACCIONES[estadoActual] || [];
            const permiteSesion = ["confirmado", "realizado"].includes(
              estadoActual,
            );

            return (
              <TableRow key={turno.id_turno} hover>
                <TableCell>{fechaTexto(turno.fecha)}</TableCell>
                <TableCell>{horaTexto(turno.hora)}</TableCell>
                <TableCell>
                  {nombreCompleto(
                    turno.paciente_nombre,
                    turno.paciente_apellido,
                  )}
                </TableCell>
                <TableCell>{turno.modalidad || "—"}</TableCell>
                <TableCell>
                  <Chip
                    label={turno.estado || "—"}
                    color={colorEstado(turno.estado)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {acciones.length || permiteSesion ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                    >
                      {acciones.map((accion) => (
                        <Button
                          key={accion.estado}
                          size="small"
                          variant="outlined"
                          color={accion.color}
                          disabled={procesando !== null}
                          onClick={() => alCambiarEstado(turno, accion.estado)}
                        >
                          {procesando?.id === turno.id_turno &&
                          procesando?.estado === accion.estado
                            ? "Guardando..."
                            : accion.texto}
                        </Button>
                      ))}
                      {permiteSesion && (
                        <Button
                          size="small"
                          variant="contained"
                          disabled={procesando !== null}
                          onClick={() => alRegistrarSesion(turno)}
                        >
                          Sesión
                        </Button>
                      )}
                    </Stack>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function PanelTerapeuta() {
  const [datos, setDatos] = useState({
    perfil: null,
    pacientes: [],
    turnos: [],
    cargando: true,
    errores: [],
  });

  const [pestana, setPestana] = useState(0);
  const [recarga, setRecarga] = useState(0);
  const [procesando, setProcesando] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [idPaciente, setIdPaciente] = useState("");
  const [idTurnoSesion, setIdTurnoSesion] = useState("");
  const [idSesionEditar, setIdSesionEditar] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");
  const [recargaHistorial, setRecargaHistorial] = useState(0);
  const [guardandoSesion, setGuardandoSesion] = useState(false);

  useEffect(() => {
    const controlador = new AbortController();
    const signal = controlador.signal;

    Promise.allSettled([
      consultar("/terapeutas/mi-perfil", signal),
      consultar("/pacientes/mis-pacientes-terapeuta", signal),
      consultar("/turnos/mis-turnos-terapeuta", signal),
    ]).then((resultados) => {
      if (signal.aborted) return;

      const errores = [];
      const secciones = ["perfil", "pacientes", "turnos"];

      resultados.forEach((resultado, indice) => {
        if (resultado.status === "rejected") {
          errores.push(
            `Error en ${secciones[indice]}: ${resultado.reason?.message || "Error desconocido"}`,
          );
        }
      });

      setDatos((anterior) => {
        const valor = (indice, defecto) =>
          resultados[indice].status === "fulfilled"
            ? resultados[indice].value
            : defecto;

        const pacientes = valor(1, anterior.pacientes);
        const turnos = valor(2, anterior.turnos);

        return {
          perfil: valor(0, anterior.perfil),
          pacientes: Array.isArray(pacientes) ? pacientes : anterior.pacientes,
          turnos: Array.isArray(turnos) ? turnos : anterior.turnos,
          cargando: false,
          errores,
        };
      });
    });

    return () => controlador.abort();
  }, [recarga]);

  useEffect(() => {
    if (!idPaciente || pestana !== 3) return;

    const controlador = new AbortController();
    setCargandoHistorial(true);
    setErrorHistorial("");

    consultar(`/sesiones/paciente/${idPaciente}`, controlador.signal)
      .then((resultado) => {
        if (!controlador.signal.aborted) {
          setHistorial(Array.isArray(resultado) ? resultado : []);
        }
      })
      .catch((error) => {
        if (!controlador.signal.aborted) {
          setErrorHistorial(error.message);
        }
      })
      .finally(() => {
        if (!controlador.signal.aborted) {
          setCargandoHistorial(false);
        }
      });

    return () => controlador.abort();
  }, [idPaciente, pestana, recargaHistorial]);

  const actualizar = () => {
    setAviso(null);
    setDatos((anterior) => ({
      ...anterior,
      cargando: true,
      errores: [],
    }));
    setRecarga((valor) => valor + 1);
    setRecargaHistorial((valor) => valor + 1);
  };

  const cambiarEstado = async (turno, estado) => {
    if (procesando !== null) return;

    if (
      estado === "cancelado" &&
      !window.confirm("¿Querés cancelar este turno?")
    ) {
      return;
    }

    setProcesando({ id: turno.id_turno, estado });
    setAviso(null);

    try {
      await consultar(`/turnos/${turno.id_turno}/estado`, undefined, {
        method: "PATCH",
        body: { estado },
      });

      setDatos((anterior) => ({
        ...anterior,
        turnos: anterior.turnos.map((item) =>
          item.id_turno === turno.id_turno ? { ...item, estado } : item,
        ),
      }));

      setAviso({
        tipo: "success",
        texto: "Estado del turno actualizado correctamente.",
      });

      setRecarga((valor) => valor + 1);
    } catch (error) {
      setAviso({
        tipo: "error",
        texto: error.message || "No se pudo actualizar el turno.",
      });
    } finally {
      setProcesando(null);
    }
  };

  const elegirPaciente = (valor) => {
    setIdPaciente(String(valor));
    setIdTurnoSesion("");
    setIdSesionEditar(null);
    setFormulario(FORMULARIO_VACIO);
    setHistorial([]);
    setErrorHistorial("");
    setAviso(null);
  };

  const abrirSesion = (turno) => {
    elegirPaciente(turno.id_paciente);
    setIdTurnoSesion(String(turno.id_turno));
    setPestana(3);
  };

  const editarSesion = (sesion) => {
    setIdSesionEditar(sesion.id_sesion);
    setIdTurnoSesion("");
    setFormulario({
      evolucion: sesion.evolucion || "",
      observaciones: sesion.observaciones || "",
      recomendaciones: sesion.recomendaciones || "",
    });
    setAviso(null);
  };

  const cancelarEdicion = () => {
    setIdSesionEditar(null);
    setIdTurnoSesion("");
    setFormulario(FORMULARIO_VACIO);
  };

  const guardarSesion = async (evento) => {
    evento.preventDefault();

    if (guardandoSesion) return;

    if (!idSesionEditar && !idTurnoSesion) {
      setAviso({
        tipo: "error",
        texto: "Seleccioná un turno para registrar la sesión.",
      });
      return;
    }

    if (!formulario.evolucion.trim()) {
      setAviso({
        tipo: "error",
        texto: "Completá la evolución de la sesión.",
      });
      return;
    }

    setGuardandoSesion(true);
    setAviso(null);

    const turnoGuardado = idTurnoSesion;
    const esEdicion = idSesionEditar !== null;

    try {
      await consultar(
        esEdicion ? `/sesiones/${idSesionEditar}` : "/sesiones",
        undefined,
        {
          method: esEdicion ? "PUT" : "POST",
          body: {
            ...(!esEdicion ? { idTurno: Number(idTurnoSesion) } : {}),
            evolucion: formulario.evolucion.trim(),
            observaciones: formulario.observaciones.trim(),
            recomendaciones: formulario.recomendaciones.trim(),
          },
        },
      );

      if (!esEdicion) {
        setDatos((anterior) => ({
          ...anterior,
          turnos: anterior.turnos.map((turno) =>
            String(turno.id_turno) === turnoGuardado
              ? { ...turno, estado: "realizado" }
              : turno,
          ),
        }));
      }

      cancelarEdicion();

      setAviso({
        tipo: "success",
        texto: esEdicion
          ? "Sesión actualizada correctamente."
          : "Sesión registrada correctamente.",
      });

      setRecargaHistorial((valor) => valor + 1);
      setRecarga((valor) => valor + 1);
    } catch (error) {
      const mensaje =
        error.status === 409
          ? `${error.message}. Revisá el historial para editar la sesión existente.`
          : error.message;

      setAviso({
        tipo: "error",
        texto: mensaje || "No se pudo guardar la sesión.",
      });
    } finally {
      setGuardandoSesion(false);
    }
  };

  const { perfil, pacientes, turnos, cargando, errores } = datos;

  const proximos = turnos
    .filter(
      (turno) =>
        fechaTurno(turno) >= new Date() &&
        ["solicitado", "confirmado"].includes(
          String(turno.estado || "").toLowerCase(),
        ),
    )
    .sort((a, b) => fechaTurno(a) - fechaTurno(b));

  const realizados = turnos.filter(
    (turno) => String(turno.estado || "").toLowerCase() === "realizado",
  ).length;

  const turnosOrdenados = [...turnos].sort(
    (a, b) => fechaTurno(b) - fechaTurno(a),
  );

  const turnosDelPaciente = turnosOrdenados.filter(
    (turno) =>
      String(turno.id_paciente) === idPaciente &&
      ["confirmado", "realizado"].includes(
        String(turno.estado || "").toLowerCase(),
      ),
  );

  if (cargando) {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
        <CircularProgress />
        <Typography>Cargando panel del terapeuta...</Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Panel Terapeuta
          </Typography>
          <Typography color="text.secondary">
            {perfil
              ? `Bienvenido, ${nombreCompleto(perfil.nombre, perfil.apellido)}`
              : "Fundación La Estrella"}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={actualizar}
          disabled={procesando !== null || guardandoSesion}
        >
          Actualizar datos
        </Button>
      </Stack>

      {aviso && (
        <Alert
          severity={aviso.tipo}
          sx={{ mb: 2 }}
          onClose={() => setAviso(null)}
        >
          {aviso.texto}
        </Alert>
      )}

      {errores.map((error, indice) => (
        <Alert key={indice} severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ))}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          ["Mis pacientes", pacientes.length],
          ["Próximos turnos", proximos.length],
          ["Turnos realizados", realizados],
        ].map(([titulo, cantidad]) => (
          <Paper key={titulo} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography color="text.secondary">{titulo}</Typography>
            <Typography variant="h3" fontWeight="bold">
              {cantidad}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Tabs
          value={pestana}
          onChange={(_, valor) => setPestana(valor)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Mi perfil" />
          <Tab label="Mis pacientes" />
          <Tab label="Mis turnos" />
          <Tab label="Mis sesiones" />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {pestana === 0 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Mi perfil
              </Typography>

              {!perfil ? (
                <Alert severity="info">No hay información del perfil.</Alert>
              ) : (
                <Stack spacing={1.5}>
                  <Typography>
                    <strong>Nombre:</strong>{" "}
                    {nombreCompleto(perfil.nombre, perfil.apellido)}
                  </Typography>
                  <Typography>
                    <strong>Especialidad:</strong> {perfil.especialidad || "—"}
                  </Typography>
                  <Typography>
                    <strong>Email:</strong> {perfil.email || "—"}
                  </Typography>
                  <Typography>
                    <strong>Teléfono:</strong> {perfil.telefono || "—"}
                  </Typography>
                  <Typography>
                    <strong>DNI:</strong> {perfil.dni || "—"}
                  </Typography>
                  <Box>
                    <Chip
                      label={perfil.estado || "—"}
                      color={colorEstado(perfil.estado)}
                    />
                  </Box>
                </Stack>
              )}
            </>
          )}

          {pestana === 1 && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Mis pacientes ({pacientes.length})
              </Typography>

              {!pacientes.length ? (
                <Alert severity="info">No tenés pacientes vinculados.</Alert>
              ) : (
                <TableContainer>
                  <Table size="small" sx={{ minWidth: 550 }}>
                    <TableHead>
                      <TableRow>
                        {[
                          "Nombre",
                          "Teléfono",
                          "Email",
                          "Estado",
                          "Historial",
                        ].map((titulo) => (
                          <TableCell key={titulo}>{titulo}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pacientes.map((paciente) => (
                        <TableRow key={paciente.id_paciente} hover>
                          <TableCell>
                            {nombreCompleto(paciente.nombre, paciente.apellido)}
                          </TableCell>
                          <TableCell>{paciente.telefono || "—"}</TableCell>
                          <TableCell>{paciente.email || "—"}</TableCell>
                          <TableCell>
                            <Chip
                              label={paciente.estado || "—"}
                              color={colorEstado(paciente.estado)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => {
                                elegirPaciente(paciente.id_paciente);
                                setPestana(3);
                              }}
                            >
                              Ver historial
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {pestana === 2 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Próximos turnos ({proximos.length})
                </Typography>
                <TablaTurnos
                  turnos={proximos}
                  alCambiarEstado={cambiarEstado}
                  alRegistrarSesion={abrirSesion}
                  procesando={procesando}
                />
              </Box>

              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Todos mis turnos ({turnos.length})
                </Typography>
                <TablaTurnos
                  turnos={turnosOrdenados}
                  alCambiarEstado={cambiarEstado}
                  alRegistrarSesion={abrirSesion}
                  procesando={procesando}
                />
              </Box>
            </Stack>
          )}

          {pestana === 3 && (
            <Stack spacing={3}>
              <Typography variant="h6">Mis sesiones</Typography>

              <TextField
                select
                label="Paciente"
                value={idPaciente}
                fullWidth
                disabled={guardandoSesion}
                onChange={(evento) => elegirPaciente(evento.target.value)}
              >
                <MenuItem value="">Seleccioná un paciente</MenuItem>
                {pacientes.map((paciente) => (
                  <MenuItem
                    key={paciente.id_paciente}
                    value={String(paciente.id_paciente)}
                  >
                    {nombreCompleto(paciente.nombre, paciente.apellido)}
                  </MenuItem>
                ))}
              </TextField>

              {!idPaciente ? (
                <Alert severity="info">
                  Seleccioná un paciente para registrar sesiones o consultar su
                  historial.
                </Alert>
              ) : (
                <>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {idSesionEditar !== null
                        ? "Editar sesión"
                        : "Registrar sesión"}
                    </Typography>

                    <Box component="form" onSubmit={guardarSesion}>
                      <Stack spacing={2}>
                        {idSesionEditar === null && (
                          <TextField
                            select
                            label="Turno"
                            value={idTurnoSesion}
                            fullWidth
                            required
                            onChange={(evento) =>
                              setIdTurnoSesion(evento.target.value)
                            }
                          >
                            <MenuItem value="">Seleccioná un turno</MenuItem>
                            {turnosDelPaciente.map((turno) => (
                              <MenuItem
                                key={turno.id_turno}
                                value={String(turno.id_turno)}
                              >
                                {fechaTexto(turno.fecha)} -{" "}
                                {horaTexto(turno.hora)} - {turno.estado}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}

                        {idSesionEditar === null &&
                          !turnosDelPaciente.length && (
                            <Alert severity="info">
                              Este paciente no tiene turnos confirmados o
                              realizados.
                            </Alert>
                          )}

                        <TextField
                          label="Evolución"
                          multiline
                          rows={3}
                          required
                          fullWidth
                          value={formulario.evolucion}
                          onChange={(evento) =>
                            setFormulario((anterior) => ({
                              ...anterior,
                              evolucion: evento.target.value,
                            }))
                          }
                        />

                        <TextField
                          label="Observaciones"
                          multiline
                          rows={3}
                          fullWidth
                          value={formulario.observaciones}
                          onChange={(evento) =>
                            setFormulario((anterior) => ({
                              ...anterior,
                              observaciones: evento.target.value,
                            }))
                          }
                        />

                        <TextField
                          label="Recomendaciones"
                          multiline
                          rows={3}
                          fullWidth
                          value={formulario.recomendaciones}
                          onChange={(evento) =>
                            setFormulario((anterior) => ({
                              ...anterior,
                              recomendaciones: evento.target.value,
                            }))
                          }
                        />

                        <Stack direction="row" spacing={2}>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={
                              guardandoSesion ||
                              (!idSesionEditar && !turnosDelPaciente.length)
                            }
                          >
                            {guardandoSesion
                              ? "Guardando..."
                              : idSesionEditar !== null
                                ? "Guardar cambios"
                                : "Registrar sesión"}
                          </Button>

                          {idSesionEditar !== null && (
                            <Button
                              onClick={cancelarEdicion}
                              disabled={guardandoSesion}
                            >
                              Cancelar edición
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                    </Box>
                  </Paper>

                  <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Historial de sesiones ({historial.length})
                    </Typography>

                    {cargandoHistorial ? (
                      <CircularProgress size={24} />
                    ) : errorHistorial ? (
                      <Alert severity="error">{errorHistorial}</Alert>
                    ) : !historial.length ? (
                      <Alert severity="info">
                        Este paciente todavía no tiene sesiones registradas con
                        vos.
                      </Alert>
                    ) : (
                      <Stack spacing={2}>
                        {historial.map((sesion) => (
                          <Paper
                            key={sesion.id_sesion}
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 2 }}
                          >
                            <Stack
                              direction={{
                                xs: "column",
                                sm: "row",
                              }}
                              justifyContent="space-between"
                              alignItems={{
                                xs: "flex-start",
                                sm: "center",
                              }}
                              spacing={1}
                              sx={{ mb: 1 }}
                            >
                              <Typography fontWeight="bold">
                                Sesión del{" "}
                                {fechaTexto(sesion.fecha_realizacion)}
                              </Typography>
                              <Button
                                size="small"
                                onClick={() => editarSesion(sesion)}
                                disabled={guardandoSesion}
                              >
                                Editar
                              </Button>
                            </Stack>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              Turno: {fechaTexto(sesion.fecha)} -{" "}
                              {horaTexto(sesion.hora)}
                            </Typography>

                            <Typography sx={{ whiteSpace: "pre-wrap" }}>
                              <strong>Evolución:</strong>{" "}
                              {sesion.evolucion || "—"}
                            </Typography>

                            <Typography sx={{ whiteSpace: "pre-wrap" }}>
                              <strong>Observaciones:</strong>{" "}
                              {sesion.observaciones || "—"}
                            </Typography>

                            <Typography sx={{ whiteSpace: "pre-wrap" }}>
                              <strong>Recomendaciones:</strong>{" "}
                              {sesion.recomendaciones || "—"}
                            </Typography>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </>
              )}
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
