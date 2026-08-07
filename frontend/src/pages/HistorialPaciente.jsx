import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import api from "../services/api";

function HistorialPaciente() {
  const navigate = useNavigate();
  const { idPaciente } = useParams();

  const [historial, setHistorial] = useState([]);
  const [paciente, setPaciente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarHistorial() {
      try {
        setError("");

        const [respuestaPaciente, respuestaHistorial] = await Promise.all([
          api.get(`/pacientes/${idPaciente}`),
          api.get(`/sesiones/paciente/${idPaciente}`),
        ]);

        setPaciente(respuestaPaciente.data);
        setHistorial(respuestaHistorial.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No se pudo cargar el historial terapéutico",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarHistorial();
  }, [idPaciente]);

  function formatearFecha(fecha) {
    if (!fecha) return "-";

    return String(fecha).substring(0, 10).split("-").reverse().join("/");
  }
  function formatearHora(hora) {
    if (!hora) return "-";

    const texto = String(hora);

    if (texto.includes("T")) {
      return texto.substring(11, 16);
    }

    return texto.substring(0, 5);
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
            Historial terapéutico
          </Typography>

          {paciente && (
            <Typography color="text.secondary">
              {paciente.nombre} {paciente.apellido} — DNI {paciente.dni}
            </Typography>
          )}
        </Box>

        <Button variant="outlined" onClick={() => navigate("/pacientes")}>
          Volver a pacientes
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {historial.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography color="text.secondary">
            El paciente todavía no tiene sesiones terapéuticas registradas.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {historial.map((sesion) => (
            <Paper
              key={sesion.id_sesion}
              sx={{
                p: 3,
                borderRadius: 3,
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Sesión del {formatearFecha(sesion.fecha)}
                  </Typography>

                  <Typography color="text.secondary">
                    Terapeuta: {sesion.nombre} {sesion.apellido}
                  </Typography>

                  <Typography color="text.secondary">
                    Hora: {formatearHora(sesion.hora)}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography fontWeight="bold">Evolución</Typography>

                  <Typography sx={{ whiteSpace: "pre-wrap" }}>
                    {sesion.evolucion || "Sin información registrada."}
                  </Typography>
                </Box>

                <Box>
                  <Typography fontWeight="bold">Observaciones</Typography>

                  <Typography sx={{ whiteSpace: "pre-wrap" }}>
                    {sesion.observaciones || "Sin observaciones registradas."}
                  </Typography>
                </Box>

                <Box>
                  <Typography fontWeight="bold">Recomendaciones</Typography>

                  <Typography sx={{ whiteSpace: "pre-wrap" }}>
                    {sesion.recomendaciones ||
                      "Sin recomendaciones registradas."}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default HistorialPaciente;
