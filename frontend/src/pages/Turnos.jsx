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
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

function Turnos() {
  const navigate = useNavigate();
  const location = useLocation();

  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarTurnos() {
      try {
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
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Gestión de Turnos
        </Typography>

        <Button variant="contained" onClick={() => navigate("/turnos/nuevo")}>
          Nuevo turno
        </Button>
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
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {turnos.map((turno) => (
              <TableRow key={turno.id_turno} hover>
                <TableCell>
                  {new Date(turno.fecha).toLocaleDateString("es-AR")}
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
                      turno.estado === "confirmado" ? "success" : "warning"
                    }
                  />
                </TableCell>

                <TableCell>
                  <Button
                    size="small"
                    onClick={() => navigate(`/turnos/${turno.id_turno}/editar`)}
                  >
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Turnos;
