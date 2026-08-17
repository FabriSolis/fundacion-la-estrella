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

function Cursos() {
  const navigate = useNavigate();
  const location = useLocation();

  const [cursos, setCursos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarCursos() {
      try {
        setError("");

        const respuesta = await api.get("/cursos");
        setCursos(respuesta.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje || "No se pudieron cargar los cursos",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarCursos();
  }, []);

  const cursosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return cursos;
    }

    return cursos.filter((curso) => {
      const docente =
        `${curso.docente_nombre} ${curso.docente_apellido}`.toLowerCase();

      return (
        curso.nombre?.toLowerCase().includes(texto) ||
        curso.nivel?.toLowerCase().includes(texto) ||
        curso.modalidad?.toLowerCase().includes(texto) ||
        docente.includes(texto)
      );
    });
  }, [cursos, busqueda]);

  function formatearFecha(fecha) {
    if (!fecha) return "-";

    return String(fecha).substring(0, 10).split("-").reverse().join("/");
  }

  function colorEstado(estado) {
    switch (estado) {
      case "activo":
        return "success";

      case "planificado":
        return "warning";

      case "finalizado":
        return "info";

      case "cancelado":
        return "error";

      default:
        return "default";
    }
  }

  async function cambiarEstado(curso, nuevoEstado) {
    const confirmar = window.confirm(
      `¿Deseás cambiar el estado del curso a ${nuevoEstado}?`,
    );

    if (!confirmar) return;

    try {
      await api.patch(`/cursos/${curso.id_curso}/estado`, {
        estado: nuevoEstado,
      });

      setCursos((anteriores) =>
        anteriores.map((item) =>
          item.id_curso === curso.id_curso
            ? { ...item, estado: nuevoEstado }
            : item,
        ),
      );
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No se pudo cambiar el estado del curso",
      );
    }
  }

  if (cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
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
            Gestión de cursos
          </Typography>

          <Typography color="text.secondary">
            Administración de cursos, niveles, docentes y modalidades.
          </Typography>
        </Box>

        <Button variant="contained" onClick={() => navigate("/cursos/nuevo")}>
          Nuevo curso
        </Button>
      </Stack>

      <TextField
        fullWidth
        label="Buscar por curso, nivel, modalidad o docente"
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
              <TableCell>Docente</TableCell>
              <TableCell>Modalidad</TableCell>
              <TableCell>Inicio</TableCell>
              <TableCell>Fin</TableCell>
              <TableCell>Cupo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {cursosFiltrados.map((curso) => (
              <TableRow key={curso.id_curso} hover>
                <TableCell>{curso.nombre}</TableCell>

                <TableCell>{curso.nivel}</TableCell>

                <TableCell>
                  {curso.docente_nombre} {curso.docente_apellido}
                </TableCell>

                <TableCell>{curso.modalidad}</TableCell>

                <TableCell>{formatearFecha(curso.fecha_inicio)}</TableCell>

                <TableCell>{formatearFecha(curso.fecha_fin)}</TableCell>

                <TableCell>{curso.cupo || "-"}</TableCell>

                <TableCell>
                  <Chip
                    label={curso.estado}
                    color={colorEstado(curso.estado)}
                    size="small"
                  />
                </TableCell>

                <TableCell align="center">
                  <Button
                    size="small"
                    onClick={() => navigate(`/cursos/${curso.id_curso}/editar`)}
                  >
                    Editar
                  </Button>

                  {curso.estado !== "activo" && (
                    <Button
                      size="small"
                      color="success"
                      onClick={() => cambiarEstado(curso, "activo")}
                    >
                      Activar
                    </Button>
                  )}

                  {curso.estado !== "finalizado" && (
                    <Button
                      size="small"
                      color="info"
                      onClick={() => cambiarEstado(curso, "finalizado")}
                    >
                      Finalizar
                    </Button>
                  )}

                  {curso.estado !== "cancelado" && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => cambiarEstado(curso, "cancelado")}
                    >
                      Cancelar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {cursosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No se encontraron cursos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Cursos;
