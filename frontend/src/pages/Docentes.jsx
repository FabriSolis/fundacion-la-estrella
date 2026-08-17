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

function Docentes() {
  const navigate = useNavigate();
  const location = useLocation();

  const [docentes, setDocentes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarDocentes() {
      try {
        setError("");

        const respuesta = await api.get("/docentes");
        setDocentes(respuesta.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje || "No se pudieron cargar los docentes",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarDocentes();
  }, []);

  const docentesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return docentes;
    }

    return docentes.filter((docente) => {
      const nombreCompleto =
        `${docente.nombre} ${docente.apellido}`.toLowerCase();

      return (
        nombreCompleto.includes(texto) ||
        docente.dni?.toLowerCase().includes(texto) ||
        docente.email?.toLowerCase().includes(texto) ||
        docente.especialidad?.toLowerCase().includes(texto)
      );
    });
  }, [docentes, busqueda]);

  async function cambiarEstado(docente) {
    const nuevoEstado = docente.estado === "activo" ? "inactivo" : "activo";

    const confirmar = window.confirm(
      `¿Deseás cambiar el estado del docente a ${nuevoEstado}?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      await api.patch(`/docentes/${docente.id_docente}/estado`, {
        estado: nuevoEstado,
      });

      setDocentes((anteriores) =>
        anteriores.map((item) =>
          item.id_docente === docente.id_docente
            ? { ...item, estado: nuevoEstado }
            : item,
        ),
      );
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No se pudo cambiar el estado del docente",
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
            Gestión de docentes
          </Typography>

          <Typography color="text.secondary">
            Registro y administración de docentes responsables de los cursos.
          </Typography>
        </Box>

        <Button variant="contained" onClick={() => navigate("/docentes/nuevo")}>
          Nuevo docente
        </Button>
      </Stack>

      <TextField
        fullWidth
        label="Buscar por nombre, DNI, correo o especialidad"
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
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Especialidad</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {docentesFiltrados.map((docente) => (
              <TableRow key={docente.id_docente} hover>
                <TableCell>{docente.id_docente}</TableCell>

                <TableCell>
                  {docente.nombre} {docente.apellido}
                </TableCell>

                <TableCell>{docente.dni}</TableCell>

                <TableCell>{docente.email}</TableCell>

                <TableCell>{docente.telefono || "-"}</TableCell>

                <TableCell>{docente.especialidad || "-"}</TableCell>

                <TableCell>
                  <Chip
                    label={docente.estado}
                    color={docente.estado === "activo" ? "success" : "default"}
                    size="small"
                  />
                </TableCell>

                <TableCell align="center">
                  <Button
                    size="small"
                    onClick={() =>
                      navigate(`/docentes/${docente.id_docente}/editar`)
                    }
                  >
                    Editar
                  </Button>

                  <Button
                    size="small"
                    color={docente.estado === "activo" ? "error" : "success"}
                    onClick={() => cambiarEstado(docente)}
                  >
                    {docente.estado === "activo" ? "Desactivar" : "Activar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {docentesFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No se encontraron docentes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Docentes;
