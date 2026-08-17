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

function FormularioCurso() {
  const navigate = useNavigate();
  const { id } = useParams();

  const esEdicion = Boolean(id);

  const [docentes, setDocentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    idDocente: "",
    nombre: "",
    nivel: "Inicial",
    descripcion: "",
    duracionMeses: "",
    modalidad: "mixta",
    fechaInicio: "",
    fechaFin: "",
    cupo: "",
    estado: "planificado",
  });

  useEffect(() => {
    async function cargarDatos() {
      try {
        setError("");

        const respuestaDocentes = await api.get("/cursos/docentes");
        setDocentes(respuestaDocentes.data);

        if (esEdicion) {
          const respuestaCurso = await api.get(`/cursos/${id}`);
          const curso = respuestaCurso.data;

          setFormulario({
            idDocente: curso.id_docente,
            nombre: curso.nombre || "",
            nivel: curso.nivel || "",
            descripcion: curso.descripcion || "",
            duracionMeses: curso.duracion_meses || "",
            modalidad: curso.modalidad || "mixta",
            fechaInicio: curso.fecha_inicio
              ? String(curso.fecha_inicio).substring(0, 10)
              : "",
            fechaFin: curso.fecha_fin
              ? String(curso.fecha_fin).substring(0, 10)
              : "",
            cupo: curso.cupo || "",
            estado: curso.estado || "planificado",
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
      !formulario.idDocente ||
      !formulario.nombre.trim() ||
      !formulario.nivel.trim() ||
      !formulario.modalidad ||
      !formulario.fechaInicio
    ) {
      setError("Completá todos los campos obligatorios");
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        idDocente: Number(formulario.idDocente),
        nombre: formulario.nombre,
        nivel: formulario.nivel,
        descripcion: formulario.descripcion,
        duracionMeses: formulario.duracionMeses
          ? Number(formulario.duracionMeses)
          : null,
        modalidad: formulario.modalidad,
        fechaInicio: formulario.fechaInicio,
        fechaFin: formulario.fechaFin || null,
        cupo: formulario.cupo ? Number(formulario.cupo) : null,
        estado: formulario.estado,
      };

      if (esEdicion) {
        await api.put(`/cursos/${id}`, datos);
      } else {
        await api.post("/cursos", datos);
      }

      navigate("/cursos", {
        state: {
          mensaje: esEdicion
            ? "Curso actualizado correctamente"
            : "Curso registrado correctamente",
        },
      });
    } catch (error) {
      setError(error.response?.data?.mensaje || "No se pudo guardar el curso");
    } finally {
      setGuardando(false);
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
    <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 900 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {esEdicion ? "Editar curso" : "Nuevo curso"}
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Completá la información académica y organizativa del curso.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={manejarEnvio}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            required
            label="Nombre del curso"
            name="nombre"
            value={formulario.nombre}
            onChange={manejarCambio}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth required>
              <InputLabel>Docente</InputLabel>

              <Select
                name="idDocente"
                label="Docente"
                value={formulario.idDocente}
                onChange={manejarCambio}
              >
                {docentes.map((docente) => (
                  <MenuItem key={docente.id_docente} value={docente.id_docente}>
                    {docente.apellido}, {docente.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Nivel</InputLabel>

              <Select
                name="nivel"
                label="Nivel"
                value={formulario.nivel}
                onChange={manejarCambio}
              >
                <MenuItem value="Inicial">Inicial</MenuItem>
                <MenuItem value="Intermedio">Intermedio</MenuItem>
                <MenuItem value="Profesorado">Profesorado</MenuItem>
                <MenuItem value="Otro">Otro</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Descripción"
            name="descripcion"
            value={formulario.descripcion}
            onChange={manejarCambio}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              type="number"
              label="Duración en meses"
              name="duracionMeses"
              value={formulario.duracionMeses}
              onChange={manejarCambio}
            />

            <TextField
              fullWidth
              type="number"
              label="Cupo"
              name="cupo"
              value={formulario.cupo}
              onChange={manejarCambio}
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
                <MenuItem value="planificado">Planificado</MenuItem>

                <MenuItem value="activo">Activo</MenuItem>

                <MenuItem value="finalizado">Finalizado</MenuItem>

                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              required
              type="date"
              label="Fecha de inicio"
              name="fechaInicio"
              value={formulario.fechaInicio}
              onChange={manejarCambio}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <TextField
              fullWidth
              type="date"
              label="Fecha de finalización"
              name="fechaFin"
              value={formulario.fechaFin}
              onChange={manejarCambio}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Stack>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate("/cursos")}
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
                "Registrar curso"
              )}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

export default FormularioCurso;
