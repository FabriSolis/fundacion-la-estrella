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

function Terapeutas() {
  const navigate = useNavigate();
  const location = useLocation();

  const [terapeutas, setTerapeutas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarTerapeutas() {
      try {
        setCargando(true);
        setError("");

        const respuesta = await api.get("/terapeutas");
        setTerapeutas(respuesta.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No se pudieron cargar los terapeutas",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarTerapeutas();
  }, []);

  const terapeutasFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return terapeutas;
    }

    return terapeutas.filter((terapeuta) => {
      const nombreCompleto =
        `${terapeuta.nombre} ${terapeuta.apellido}`.toLowerCase();

      return (
        nombreCompleto.includes(texto) ||
        terapeuta.dni?.toLowerCase().includes(texto) ||
        terapeuta.email?.toLowerCase().includes(texto) ||
        terapeuta.especialidad?.toLowerCase().includes(texto)
      );
    });
  }, [terapeutas, busqueda]);

  const cambiarEstado = async (terapeuta) => {
    const nuevoEstado = terapeuta.estado === "activo" ? "inactivo" : "activo";

    const confirmar = window.confirm(
      `¿Deseás cambiar el estado del terapeuta a ${nuevoEstado}?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      await api.patch(`/terapeutas/${terapeuta.id_terapeuta}/estado`, {
        estado: nuevoEstado,
      });

      setTerapeutas((anteriores) =>
        anteriores.map((item) =>
          item.id_terapeuta === terapeuta.id_terapeuta
            ? { ...item, estado: nuevoEstado }
            : item,
        ),
      );
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No se pudo cambiar el estado del terapeuta",
      );
    }
  };

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
            Gestión de terapeutas
          </Typography>

          <Typography color="text.secondary">
            Registro y administración de profesionales terapéuticos.
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={() => navigate("/terapeutas/nuevo")}
        >
          Nuevo terapeuta
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

      {cargando ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre y apellido</TableCell>
                <TableCell>DNI</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Especialidad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {terapeutasFiltrados.map((terapeuta) => (
                <TableRow key={terapeuta.id_terapeuta} hover>
                  <TableCell>{terapeuta.id_terapeuta}</TableCell>

                  <TableCell>
                    {terapeuta.nombre} {terapeuta.apellido}
                  </TableCell>

                  <TableCell>{terapeuta.dni}</TableCell>
                  <TableCell>{terapeuta.telefono || "-"}</TableCell>
                  <TableCell>{terapeuta.email}</TableCell>

                  <TableCell>{terapeuta.especialidad || "-"}</TableCell>

                  <TableCell>
                    <Chip
                      label={terapeuta.estado}
                      color={
                        terapeuta.estado === "activo" ? "success" : "default"
                      }
                      size="small"
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      size="small"
                      onClick={() =>
                        navigate(`/terapeutas/${terapeuta.id_terapeuta}/editar`)
                      }
                    >
                      Editar
                    </Button>

                    <Button
                      size="small"
                      color={
                        terapeuta.estado === "activo" ? "error" : "success"
                      }
                      onClick={() => cambiarEstado(terapeuta)}
                    >
                      {terapeuta.estado === "activo" ? "Desactivar" : "Activar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {terapeutasFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No se encontraron terapeutas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default Terapeutas;
