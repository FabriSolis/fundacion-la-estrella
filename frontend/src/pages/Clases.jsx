import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import api from "../services/api";

function Clases() {
  const navigate = useNavigate();
  const location = useLocation();

  const [clases, setClases] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarClases() {
      try {
        setError("");

        const respuesta = await api.get("/clases");
        setClases(respuesta.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje || "No se pudieron cargar las clases",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarClases();
  }, []);

  const clasesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return clases;
    }

    return clases.filter((clase) => {
      return (
        clase.curso_nombre?.toLowerCase().includes(texto) ||
        clase.curso_nivel?.toLowerCase().includes(texto) ||
        clase.tema?.toLowerCase().includes(texto) ||
        clase.modalidad?.toLowerCase().includes(texto) ||
        clase.estado?.toLowerCase().includes(texto)
      );
    });
  }, [clases, busqueda]);

  function formatearFecha(fecha) {
    if (!fecha) return "-";

    return String(fecha).substring(0, 10).split("-").reverse().join("/");
  }

  function colorEstado(estado) {
    switch (estado) {
      case "programada":
        return "warning";

      case "dictada":
        return "success";

      case "suspendida":
        return "info";

      case "cancelada":
        return "error";

      default:
        return "default";
    }
  }

  async function cambiarEstado(clase, nuevoEstado) {
    const confirmar = window.confirm(
      `¿Deseás cambiar el estado de la clase a ${nuevoEstado}?`,
    );

    if (!confirmar) return;

    try {
      await api.patch(`/clases/${clase.id_clase}/estado`, {
        estado: nuevoEstado,
      });

      setClases((anteriores) =>
        anteriores.map((item) =>
          item.id_clase === clase.id_clase
            ? { ...item, estado: nuevoEstado }
            : item,
        ),
      );
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No se pudo cambiar el estado de la clase",
      );
    }
  }

  if (cargando) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Gestión de clases
          </Typography>

          <Typography color="text.secondary">
            Programación y seguimiento de las clases de cada curso.
          </Typography>
        </Box>

        <Button variant="contained" onClick={() => navigate("/clases/nueva")}>
          Nueva clase
        </Button>
      </Stack>

      <TextField
        fullWidth
        label="Buscar por curso, nivel, tema, modalidad o estado"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
        sx={{ mb: 3 }}
      />

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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Curso</TableCell>
              <TableCell>Nivel</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Horario</TableCell>
              <TableCell>Modalidad</TableCell>
              <TableCell>Tema</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {clasesFiltradas.map((clase) => (
              <TableRow key={clase.id_clase} hover>
                <TableCell>{clase.curso_nombre}</TableCell>

                <TableCell>{clase.curso_nivel}</TableCell>

                <TableCell>{formatearFecha(clase.fecha)}</TableCell>

                <TableCell>
                  {clase.hora_inicio} - {clase.hora_fin}
                </TableCell>

                <TableCell>{clase.modalidad}</TableCell>

                <TableCell>{clase.tema || "-"}</TableCell>

                <TableCell>
                  <Chip
                    label={clase.estado}
                    color={colorEstado(clase.estado)}
                    size="small"
                  />
                </TableCell>

                <TableCell align="center">
                  <Button
                    size="small"
                    onClick={() => navigate(`/clases/${clase.id_clase}/editar`)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="small"
                    color="secondary"
                    onClick={() =>
                      navigate(`/clases/${clase.id_clase}/asistencia`)
                    }
                  >
                    Tomar asistencia
                  </Button>

                  {clase.estado === "programada" && (
                    <>
                      <Button
                        size="small"
                        color="success"
                        onClick={() => cambiarEstado(clase, "dictada")}
                      >
                        Dictada
                      </Button>

                      <Button
                        size="small"
                        color="info"
                        onClick={() => cambiarEstado(clase, "suspendida")}
                      >
                        Suspender
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        onClick={() => cambiarEstado(clase, "cancelada")}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {clasesFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No se encontraron clases.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Clases;
