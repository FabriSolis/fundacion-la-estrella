import { useEffect, useMemo, useState } from "react";
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
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

function Pacientes() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  {
    location.state?.mensaje && (
      <Alert severity="success" sx={{ mb: 3 }}>
        {location.state.mensaje}
      </Alert>
    );
  }
  useEffect(() => {
    async function cargarPacientes() {
      try {
        setCargando(true);
        setError("");

        const respuesta = await api.get("/pacientes");
        setPacientes(respuesta.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No se pudieron cargar los pacientes",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarPacientes();
  }, []);

  const pacientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return pacientes;
    }

    return pacientes.filter((paciente) => {
      const nombreCompleto =
        `${paciente.nombre} ${paciente.apellido}`.toLowerCase();

      return (
        nombreCompleto.includes(texto) ||
        paciente.dni?.toLowerCase().includes(texto) ||
        paciente.email?.toLowerCase().includes(texto)
      );
    });
  }, [pacientes, busqueda]);

  const cambiarEstado = async (paciente) => {
    const nuevoEstado = paciente.estado === "activo" ? "inactivo" : "activo";

    const confirmar = window.confirm(
      `¿Deseás cambiar el estado del paciente a ${nuevoEstado}?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      await api.patch(`/pacientes/${paciente.id_paciente}/estado`, {
        estado: nuevoEstado,
      });

      setPacientes((anteriores) =>
        anteriores.map((item) =>
          item.id_paciente === paciente.id_paciente
            ? { ...item, estado: nuevoEstado }
            : item,
        ),
      );
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No se pudo cambiar el estado del paciente",
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
            Gestión de pacientes
          </Typography>

          <Typography color="text.secondary">
            Registro, consulta y seguimiento de pacientes.
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={() => navigate("/pacientes/nuevo")}
        >
          Nuevo paciente
        </Button>
      </Stack>

      <TextField
        fullWidth
        label="Buscar por nombre, DNI o correo"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
        sx={{ mb: 3 }}
      />

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
                <TableCell>Motivo de consulta</TableCell>
                <TableCell>Fecha de alta</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pacientesFiltrados.map((paciente) => (
                <TableRow key={paciente.id_paciente} hover>
                  <TableCell>{paciente.id_paciente}</TableCell>

                  <TableCell>
                    {paciente.nombre} {paciente.apellido}
                  </TableCell>

                  <TableCell>{paciente.dni}</TableCell>

                  <TableCell>{paciente.telefono || "-"}</TableCell>

                  <TableCell>{paciente.email}</TableCell>

                  <TableCell>{paciente.motivo_consulta || "-"}</TableCell>

                  <TableCell>
                    {paciente.fecha_alta
                      ? new Date(paciente.fecha_alta).toLocaleDateString(
                          "es-AR",
                        )
                      : "-"}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={paciente.estado}
                      color={
                        paciente.estado === "activo" ? "success" : "default"
                      }
                      size="small"
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      size="small"
                      onClick={() =>
                        navigate(`/pacientes/${paciente.id_paciente}/editar`)
                      }
                    >
                      Editar
                    </Button>

                    <Button
                      size="small"
                      color={paciente.estado === "activo" ? "error" : "success"}
                      onClick={() => cambiarEstado(paciente)}
                    >
                      {paciente.estado === "activo" ? "Desactivar" : "Activar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {pacientesFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No se encontraron pacientes.
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

export default Pacientes;
