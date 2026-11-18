import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  Typography,
} from "@mui/material";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

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
  };
  return colores[String(estado || "").toLowerCase()] || "default";
};

async function consultar(ruta, signal) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay una sesión iniciada");

  const respuesta = await fetch(`${API}${ruta}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(datos?.mensaje || `Error ${respuesta.status}`);
  }
  return datos;
}

function TablaTurnos({ turnos }) {
  if (!turnos.length) {
    return <Alert severity="info">No hay turnos para mostrar.</Alert>;
  }

  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            {["Fecha", "Hora", "Paciente", "Modalidad", "Estado"].map(
              (titulo) => (
                <TableCell key={titulo}>
                  <strong>{titulo}</strong>
                </TableCell>
              ),
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {turnos.map((turno) => (
            <TableRow key={turno.id_turno} hover>
              <TableCell>{fechaTexto(turno.fecha)}</TableCell>
              <TableCell>{horaTexto(turno.hora)}</TableCell>
              <TableCell>
                {nombreCompleto(turno.paciente_nombre, turno.paciente_apellido)}
              </TableCell>
              <TableCell>{turno.modalidad || "—"}</TableCell>
              <TableCell>
                <Chip
                  label={turno.estado || "—"}
                  color={colorEstado(turno.estado)}
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
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
      const nombres = ["perfil", "pacientes", "turnos"];

      resultados.forEach((resultado, indice) => {
        if (resultado.status === "rejected") {
          errores.push(
            `Error en ${nombres[indice]}: ${resultado.reason?.message || "Error desconocido"}`,
          );
        }
      });

      const valor = (indice, defecto) =>
        resultados[indice].status === "fulfilled"
          ? resultados[indice].value
          : defecto;

      const pacientes = valor(1, []);
      const turnos = valor(2, []);

      setDatos({
        perfil: valor(0, null),
        pacientes: Array.isArray(pacientes) ? pacientes : [],
        turnos: Array.isArray(turnos) ? turnos : [],
        cargando: false,
        errores,
      });
    });

    return () => controlador.abort();
  }, [recarga]);

  const actualizar = () => {
    setDatos((anterior) => ({
      ...anterior,
      cargando: true,
      errores: [],
    }));
    setRecarga((valor) => valor + 1);
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
        <Button variant="outlined" onClick={actualizar}>
          Actualizar datos
        </Button>
      </Stack>

      {errores.map((error, indice) => (
        <Alert key={indice} severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ))}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
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
        </Tabs>

        <Box sx={{ p: 3 }}>
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
                        <TableCell>Nombre</TableCell>
                        <TableCell>Teléfono</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Estado</TableCell>
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
                <TablaTurnos turnos={proximos} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Todos mis turnos ({turnos.length})
                </Typography>
                <TablaTurnos turnos={turnosOrdenados} />
              </Box>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
