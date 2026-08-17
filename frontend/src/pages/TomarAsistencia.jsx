import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import api from "../services/api";

function TomarAsistencia() {
  const navigate = useNavigate();
  const { idClase } = useParams();

  const [clase, setClase] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    async function cargarAsistencia() {
      try {
        setError("");

        const respuesta = await api.get(`/asistencias/clase/${idClase}`);

        setClase(respuesta.data.clase);

        setAlumnos(
          respuesta.data.alumnos.map((alumno) => ({
            ...alumno,

            estadoAsistencia: alumno.estado_asistencia || "presente",

            observacion: alumno.observacion || "",
          })),
        );
      } catch (error) {
        setError(
          error.response?.data?.mensaje || "No se pudo cargar la asistencia",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarAsistencia();
  }, [idClase]);

  function cambiarEstado(idAlumno, estado) {
    setAlumnos((anteriores) =>
      anteriores.map((alumno) =>
        alumno.id_alumno === idAlumno
          ? {
              ...alumno,
              estadoAsistencia: estado,
            }
          : alumno,
      ),
    );
  }

  function cambiarObservacion(idAlumno, observacion) {
    setAlumnos((anteriores) =>
      anteriores.map((alumno) =>
        alumno.id_alumno === idAlumno
          ? {
              ...alumno,
              observacion,
            }
          : alumno,
      ),
    );
  }

  async function guardarAsistencia() {
    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const asistencias = alumnos.map((alumno) => ({
        idAlumno: alumno.id_alumno,
        estadoAsistencia: alumno.estadoAsistencia,
        observacion: alumno.observacion,
      }));

      await api.put(`/asistencias/clase/${idClase}`, {
        asistencias,
      });

      setMensaje("Asistencia guardada correctamente");
    } catch (error) {
      setError(
        error.response?.data?.mensaje || "No se pudo guardar la asistencia",
      );
    } finally {
      setGuardando(false);
    }
  }

  function formatearFecha(fecha) {
    if (!fecha) return "-";

    return String(fecha).substring(0, 10).split("-").reverse().join("/");
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
            Tomar asistencia
          </Typography>

          {clase && (
            <>
              <Typography color="text.secondary">
                {clase.curso_nombre} — {clase.curso_nivel}
              </Typography>

              <Typography color="text.secondary">
                {formatearFecha(clase.fecha)} — {clase.hora_inicio} a{" "}
                {clase.hora_fin}
              </Typography>

              {clase.tema && (
                <Typography color="text.secondary">
                  Tema: {clase.tema}
                </Typography>
              )}
            </>
          )}
        </Box>

        <Button variant="outlined" onClick={() => navigate("/clases")}>
          Volver a clases
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {mensaje && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {mensaje}
        </Alert>
      )}

      {alumnos.length === 0 ? (
        <Alert severity="warning">
          No hay alumnos inscriptos en este curso.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {alumnos.map((alumno) => (
            <Paper
              key={alumno.id_alumno}
              sx={{
                p: 3,
                borderRadius: 3,
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  md: "row",
                }}
                spacing={2}
                alignItems={{
                  xs: "stretch",
                  md: "center",
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 200,
                  }}
                >
                  <Typography fontWeight="bold">
                    {alumno.apellido}, {alumno.nombre}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    DNI {alumno.dni}
                  </Typography>
                </Box>

                <FormControl
                  sx={{
                    minWidth: 180,
                  }}
                >
                  <InputLabel>Asistencia</InputLabel>

                  <Select
                    label="Asistencia"
                    value={alumno.estadoAsistencia}
                    onChange={(evento) =>
                      cambiarEstado(alumno.id_alumno, evento.target.value)
                    }
                  >
                    <MenuItem value="presente">Presente</MenuItem>

                    <MenuItem value="ausente">Ausente</MenuItem>

                    <MenuItem value="justificado">Justificado</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Observación"
                  value={alumno.observacion}
                  onChange={(evento) =>
                    cambiarObservacion(alumno.id_alumno, evento.target.value)
                  }
                  inputProps={{
                    maxLength: 255,
                  }}
                  sx={{
                    flex: 2,
                    minWidth: 250,
                  }}
                />
              </Stack>
            </Paper>
          ))}

          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={2}
            sx={{ mt: 2 }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate("/clases")}
              disabled={guardando}
            >
              Cancelar
            </Button>

            <Button
              variant="contained"
              onClick={guardarAsistencia}
              disabled={guardando}
            >
              {guardando ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Guardar asistencia"
              )}
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}

export default TomarAsistencia;
