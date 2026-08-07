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

function Alumnos() {
  const navigate = useNavigate();
  const location = useLocation();

  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarAlumnos() {
      try {
        setError("");

        const respuesta = await api.get("/alumnos");
        setAlumnos(respuesta.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje || "No se pudieron cargar los alumnos",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarAlumnos();
  }, []);

  const alumnosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return alumnos;
    }

    return alumnos.filter((alumno) => {
      const nombreCompleto =
        `${alumno.nombre} ${alumno.apellido}`.toLowerCase();

      return (
        nombreCompleto.includes(texto) ||
        alumno.dni?.toLowerCase().includes(texto) ||
        alumno.email?.toLowerCase().includes(texto)
      );
    });
  }, [alumnos, busqueda]);

  function formatearFecha(fecha) {
    if (!fecha) return "-";

    return String(fecha).substring(0, 10).split("-").reverse().join("/");
  }

  function colorEstado(estado) {
    if (estado === "activo") return "success";
    if (estado === "egresado") return "info";

    return "default";
  }

  async function cambiarEstado(alumno) {
    let nuevoEstado = "activo";

    if (alumno.estado === "activo") {
      nuevoEstado = "inactivo";
    }

    const confirmar = window.confirm(
      `¿Deseás cambiar el estado del alumno a ${nuevoEstado}?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      await api.patch(`/alumnos/${alumno.id_alumno}/estado`, {
        estado: nuevoEstado,
      });

      setAlumnos((anteriores) =>
        anteriores.map((item) =>
          item.id_alumno === alumno.id_alumno
            ? { ...item, estado: nuevoEstado }
            : item,
        ),
      );
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No se pudo cambiar el estado del alumno",
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
            Gestión de alumnos
          </Typography>

          <Typography color="text.secondary">
            Registro, consulta y seguimiento académico de alumnos.
          </Typography>
        </Box>

        <Button variant="contained" onClick={() => navigate("/alumnos/nuevo")}>
          Nuevo alumno
        </Button>
      </Stack>

      <TextField
        fullWidth
        label="Buscar por nombre, DNI o correo"
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
              <TableCell>ID</TableCell>
              <TableCell>Nombre y apellido</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Fecha de ingreso</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {alumnosFiltrados.map((alumno) => (
              <TableRow key={alumno.id_alumno} hover>
                <TableCell>{alumno.id_alumno}</TableCell>

                <TableCell>
                  {alumno.nombre} {alumno.apellido}
                </TableCell>

                <TableCell>{alumno.dni}</TableCell>

                <TableCell>{alumno.telefono || "-"}</TableCell>

                <TableCell>{alumno.email}</TableCell>

                <TableCell>{formatearFecha(alumno.fecha_ingreso)}</TableCell>

                <TableCell>
                  <Chip
                    label={alumno.estado}
                    color={colorEstado(alumno.estado)}
                    size="small"
                  />
                </TableCell>

                <TableCell align="center">
                  <Button
                    size="small"
                    onClick={() =>
                      navigate(`/alumnos/${alumno.id_alumno}/editar`)
                    }
                  >
                    Editar
                  </Button>

                  <Button size="small" color="secondary" disabled>
                    Cursos
                  </Button>

                  <Button
                    size="small"
                    color={alumno.estado === "activo" ? "error" : "success"}
                    onClick={() => cambiarEstado(alumno)}
                  >
                    {alumno.estado === "activo" ? "Desactivar" : "Activar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {alumnosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No se encontraron alumnos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Alumnos;
