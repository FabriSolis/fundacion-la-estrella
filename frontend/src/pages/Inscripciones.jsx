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

function Inscripciones() {
  const navigate = useNavigate();
  const location = useLocation();

  const [inscripciones, setInscripciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarInscripciones() {
      try {
        setError("");

        const respuesta = await api.get("/inscripciones");
        setInscripciones(respuesta.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No se pudieron cargar las inscripciones",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarInscripciones();
  }, []);

  const inscripcionesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return inscripciones;
    }

    return inscripciones.filter((inscripcion) => {
      const alumno =
        `${inscripcion.alumno_nombre} ${inscripcion.alumno_apellido}`.toLowerCase();

      return (
        alumno.includes(texto) ||
        inscripcion.alumno_dni?.toLowerCase().includes(texto) ||
        inscripcion.curso_nombre?.toLowerCase().includes(texto) ||
        inscripcion.curso_nivel?.toLowerCase().includes(texto) ||
        inscripcion.estado?.toLowerCase().includes(texto)
      );
    });
  }, [inscripciones, busqueda]);

  function formatearFecha(fecha) {
    if (!fecha) return "-";

    return String(fecha).substring(0, 10).split("-").reverse().join("/");
  }

  function colorEstado(estado) {
    switch (estado) {
      case "confirmada":
        return "success";

      case "en curso":
        return "info";

      case "pendiente":
        return "warning";

      case "finalizada":
        return "default";

      case "cancelada":
        return "error";

      default:
        return "default";
    }
  }

  async function cambiarEstado(inscripcion, nuevoEstado) {
    const confirmar = window.confirm(
      `¿Deseás cambiar el estado de la inscripción a ${nuevoEstado}?`,
    );

    if (!confirmar) return;

    try {
      await api.patch(`/inscripciones/${inscripcion.id_inscripcion}/estado`, {
        estado: nuevoEstado,
      });

      setInscripciones((anteriores) =>
        anteriores.map((item) =>
          item.id_inscripcion === inscripcion.id_inscripcion
            ? { ...item, estado: nuevoEstado }
            : item,
        ),
      );
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No se pudo cambiar el estado de la inscripción",
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
            Gestión de inscripciones
          </Typography>

          <Typography color="text.secondary">
            Inscripción de alumnos a los cursos disponibles.
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={() => navigate("/inscripciones/nueva")}
        >
          Nueva inscripción
        </Button>
      </Stack>

      <TextField
        fullWidth
        label="Buscar por alumno, DNI, curso, nivel o estado"
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
              <TableCell>Alumno</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>Curso</TableCell>
              <TableCell>Nivel</TableCell>
              <TableCell>Modalidad</TableCell>
              <TableCell>Fecha inscripción</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {inscripcionesFiltradas.map((inscripcion) => (
              <TableRow key={inscripcion.id_inscripcion} hover>
                <TableCell>
                  {inscripcion.alumno_nombre} {inscripcion.alumno_apellido}
                </TableCell>

                <TableCell>{inscripcion.alumno_dni}</TableCell>

                <TableCell>{inscripcion.curso_nombre}</TableCell>

                <TableCell>{inscripcion.curso_nivel}</TableCell>

                <TableCell>{inscripcion.curso_modalidad}</TableCell>

                <TableCell>
                  {formatearFecha(inscripcion.fecha_inscripcion)}
                </TableCell>

                <TableCell>
                  <Chip
                    label={inscripcion.estado}
                    color={colorEstado(inscripcion.estado)}
                    size="small"
                  />
                </TableCell>

                <TableCell align="center">
                  {inscripcion.estado === "pendiente" && (
                    <Button
                      size="small"
                      color="success"
                      onClick={() => cambiarEstado(inscripcion, "confirmada")}
                    >
                      Confirmar
                    </Button>
                  )}

                  {(inscripcion.estado === "confirmada" ||
                    inscripcion.estado === "pendiente") && (
                    <Button
                      size="small"
                      color="info"
                      onClick={() => cambiarEstado(inscripcion, "en curso")}
                    >
                      Iniciar
                    </Button>
                  )}

                  {inscripcion.estado === "en curso" && (
                    <Button
                      size="small"
                      onClick={() => cambiarEstado(inscripcion, "finalizada")}
                    >
                      Finalizar
                    </Button>
                  )}

                  {inscripcion.estado !== "cancelada" &&
                    inscripcion.estado !== "finalizada" && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => cambiarEstado(inscripcion, "cancelada")}
                      >
                        Cancelar
                      </Button>
                    )}
                </TableCell>
              </TableRow>
            ))}

            {inscripcionesFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No se encontraron inscripciones.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Inscripciones;
