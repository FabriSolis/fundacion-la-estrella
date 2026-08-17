import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

function FormularioInscripcion() {
  const navigate = useNavigate();

  const [alumnos, setAlumnos] = useState([]);
  const [cursos, setCursos] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    idAlumno: "",
    idCurso: "",
    fechaInscripcion: new Date().toISOString().substring(0, 10),
    estado: "pendiente",
  });

  useEffect(() => {
    async function cargarDatos() {
      try {
        setError("");

        const [respuestaAlumnos, respuestaCursos] = await Promise.all([
          api.get("/inscripciones/alumnos"),
          api.get("/inscripciones/cursos"),
        ]);

        setAlumnos(respuestaAlumnos.data);
        setCursos(respuestaCursos.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje || "No se pudieron cargar los datos",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  function manejarCambio(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError("");

    if (!formulario.idAlumno || !formulario.idCurso) {
      setError("Seleccioná un alumno y un curso");
      return;
    }

    try {
      setGuardando(true);

      await api.post("/inscripciones", {
        idAlumno: Number(formulario.idAlumno),
        idCurso: Number(formulario.idCurso),
        fechaInscripcion: formulario.fechaInscripcion,
        estado: formulario.estado,
      });

      navigate("/inscripciones", {
        state: {
          mensaje: "Inscripción registrada correctamente",
        },
      });
    } catch (error) {
      setError(
        error.response?.data?.mensaje || "No se pudo registrar la inscripción",
      );
    } finally {
      setGuardando(false);
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
    <Paper
      sx={{
        p: 4,
        borderRadius: 3,
        maxWidth: 850,
      }}
    >
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Nueva inscripción
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Seleccioná el alumno y el curso al cual se desea inscribir.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {alumnos.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No hay alumnos activos disponibles.
        </Alert>
      )}

      {cursos.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No hay cursos disponibles para inscripción.
        </Alert>
      )}

      <Box component="form" onSubmit={manejarEnvio}>
        <Stack spacing={3}>
          <FormControl fullWidth required>
            <InputLabel>Alumno</InputLabel>

            <Select
              name="idAlumno"
              label="Alumno"
              value={formulario.idAlumno}
              onChange={manejarCambio}
            >
              {alumnos.map((alumno) => (
                <MenuItem key={alumno.id_alumno} value={alumno.id_alumno}>
                  {alumno.apellido}, {alumno.nombre} — DNI {alumno.dni}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel>Curso</InputLabel>

            <Select
              name="idCurso"
              label="Curso"
              value={formulario.idCurso}
              onChange={manejarCambio}
            >
              {cursos.map((curso) => (
                <MenuItem key={curso.id_curso} value={curso.id_curso}>
                  {curso.nombre} — {curso.nivel} — {curso.modalidad}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            required
            type="date"
            label="Fecha de inscripción"
            name="fechaInscripcion"
            value={formulario.fechaInscripcion}
            onChange={manejarCambio}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <FormControl fullWidth required>
            <InputLabel>Estado</InputLabel>

            <Select
              name="estado"
              label="Estado"
              value={formulario.estado}
              onChange={manejarCambio}
            >
              <MenuItem value="pendiente">Pendiente</MenuItem>

              <MenuItem value="confirmada">Confirmada</MenuItem>

              <MenuItem value="en curso">En curso</MenuItem>
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate("/inscripciones")}
              disabled={guardando}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={
                guardando || alumnos.length === 0 || cursos.length === 0
              }
            >
              {guardando ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Registrar inscripción"
              )}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

export default FormularioInscripcion;
