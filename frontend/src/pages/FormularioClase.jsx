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

function FormularioClase() {
  const navigate = useNavigate();
  const { id } = useParams();

  const esEdicion = Boolean(id);

  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    idCurso: "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    modalidad: "presencial",
    enlaceVirtual: "",
    tema: "",
    estado: "programada",
  });

  useEffect(() => {
    async function cargarDatos() {
      try {
        setError("");

        const respuestaCursos = await api.get("/clases/cursos");
        setCursos(respuestaCursos.data);

        if (esEdicion) {
          const respuestaClase = await api.get(`/clases/${id}`);
          const clase = respuestaClase.data;

          setFormulario({
            idCurso: clase.id_curso,
            fecha: clase.fecha ? String(clase.fecha).substring(0, 10) : "",
            horaInicio: clase.hora_inicio || "",
            horaFin: clase.hora_fin || "",
            modalidad: clase.modalidad || "presencial",
            enlaceVirtual: clase.enlace_virtual || "",
            tema: clase.tema || "",
            estado: clase.estado || "programada",
          });
        }
      } catch (error) {
        setError(
          error.response?.data?.mensaje || "No se pudieron cargar los datos",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [esEdicion, id]);

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

    if (
      !formulario.idCurso ||
      !formulario.fecha ||
      !formulario.horaInicio ||
      !formulario.horaFin ||
      !formulario.modalidad
    ) {
      setError("Completá todos los campos obligatorios");
      return;
    }

    if (
      formulario.modalidad !== "presencial" &&
      !formulario.enlaceVirtual.trim()
    ) {
      setError("Ingresá el enlace para una clase virtual o mixta");
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        idCurso: Number(formulario.idCurso),
        fecha: formulario.fecha,
        horaInicio: formulario.horaInicio,
        horaFin: formulario.horaFin,
        modalidad: formulario.modalidad,
        enlaceVirtual: formulario.enlaceVirtual || null,
        tema: formulario.tema || null,
        estado: formulario.estado,
      };

      if (esEdicion) {
        await api.put(`/clases/${id}`, datos);
      } else {
        await api.post("/clases", datos);
      }

      navigate("/clases", {
        state: {
          mensaje: esEdicion
            ? "Clase actualizada correctamente"
            : "Clase registrada correctamente",
        },
      });
    } catch (error) {
      setError(error.response?.data?.mensaje || "No se pudo guardar la clase");
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
        maxWidth: 900,
      }}
    >
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {esEdicion ? "Editar clase" : "Nueva clase"}
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Programá la fecha, horario y contenido de la clase.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={manejarEnvio}>
        <Stack spacing={3}>
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
                  {curso.nombre} — {curso.nivel}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            required
            type="date"
            label="Fecha"
            name="fecha"
            value={formulario.fecha}
            onChange={manejarCambio}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              required
              type="time"
              label="Hora de inicio"
              name="horaInicio"
              value={formulario.horaInicio}
              onChange={manejarCambio}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <TextField
              fullWidth
              required
              type="time"
              label="Hora de finalización"
              name="horaFin"
              value={formulario.horaFin}
              onChange={manejarCambio}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth required>
              <InputLabel>Modalidad</InputLabel>

              <Select
                name="modalidad"
                label="Modalidad"
                value={formulario.modalidad}
                onChange={manejarCambio}
              >
                <MenuItem value="presencial">Presencial</MenuItem>

                <MenuItem value="virtual">Virtual</MenuItem>

                <MenuItem value="mixta">Mixta</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Estado</InputLabel>

              <Select
                name="estado"
                label="Estado"
                value={formulario.estado}
                onChange={manejarCambio}
              >
                <MenuItem value="programada">Programada</MenuItem>

                <MenuItem value="dictada">Dictada</MenuItem>

                <MenuItem value="suspendida">Suspendida</MenuItem>

                <MenuItem value="cancelada">Cancelada</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {formulario.modalidad !== "presencial" && (
            <TextField
              fullWidth
              required
              label="Enlace virtual"
              name="enlaceVirtual"
              value={formulario.enlaceVirtual}
              onChange={manejarCambio}
              placeholder="https://..."
            />
          )}

          <TextField
            fullWidth
            label="Tema de la clase"
            name="tema"
            value={formulario.tema}
            onChange={manejarCambio}
            inputProps={{
              maxLength: 150,
            }}
            helperText={`${formulario.tema.length}/150 caracteres`}
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate("/clases")}
              disabled={guardando}
            >
              Cancelar
            </Button>

            <Button type="submit" variant="contained" disabled={guardando}>
              {guardando ? (
                <CircularProgress size={24} color="inherit" />
              ) : esEdicion ? (
                "Guardar cambios"
              ) : (
                "Registrar clase"
              )}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

export default FormularioClase;
