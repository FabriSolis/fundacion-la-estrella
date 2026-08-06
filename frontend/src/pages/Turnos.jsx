import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../services/api";
import AgendaTurnos from "../components/AgendaTurnos";

function Turnos() {
  const navigate = useNavigate();
  const location = useLocation();

  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [vista, setVista] = useState("tabla");

  useEffect(() => {
    async function cargarTurnos() {
      try {
        setError("");

        const respuesta = await api.get("/turnos");
        setTurnos(respuesta.data);
      } catch (err) {
        setError(
          err.response?.data?.mensaje || "No se pudieron cargar los turnos",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarTurnos();
  }, []);

  if (cargando) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 5,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            md: "row",
          },
          justifyContent: "space-between",
          alignItems: {
            xs: "stretch",
            md: "center",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Gestión de Turnos
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 2,
          }}
        >
          <ToggleButtonGroup
            value={vista}
            exclusive
            onChange={(evento, nuevaVista) => {
              if (nuevaVista) {
                setVista(nuevaVista);
              }
            }}
            size="small"
          >
            <ToggleButton value="tabla">Lista</ToggleButton>
            <ToggleButton value="agenda">Agenda</ToggleButton>
          </ToggleButtonGroup>

          <Button variant="contained" onClick={() => navigate("/turnos/nuevo")}>
            Nuevo turno
          </Button>
        </Box>
      </Box>

      {location.state?.mensaje && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {location.state.mensaje}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {vista === "tabla" ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell>Paciente</TableCell>
                <TableCell>Terapeuta</TableCell>
                <TableCell>Modalidad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {turnos.map((turno) => (
                <TableRow key={turno.id_turno} hover>
                  <TableCell>
                    {turno.fecha
                      ? turno.fecha
                          .substring(0, 10)
                          .split("-")
                          .reverse()
                          .join("/")
                      : "-"}
                  </TableCell>

                  <TableCell>{turno.hora}</TableCell>

                  <TableCell>
                    {turno.paciente_nombre} {turno.paciente_apellido}
                  </TableCell>

                  <TableCell>
                    {turno.terapeuta_nombre} {turno.terapeuta_apellido}
                  </TableCell>

                  <TableCell>{turno.modalidad}</TableCell>

                  <TableCell>
                    <Chip
                      label={turno.estado}
                      color={
                        turno.estado === "confirmado"
                          ? "success"
                          : turno.estado === "cancelado"
                            ? "error"
                            : turno.estado === "realizado"
                              ? "info"
                              : "warning"
                      }
                      size="small"
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      size="small"
                      onClick={() =>
                        navigate(`/turnos/${turno.id_turno}/editar`)
                      }
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {turnos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay turnos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 2 }}>
          <AgendaTurnos turnos={turnos} />
        </Paper>
      )}
    </Box>
  );
}

export default Turnos;
