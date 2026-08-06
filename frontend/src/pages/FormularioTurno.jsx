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

function FormularioTurno() {
  const navigate = useNavigate();
  const { id } = useParams();

  const esEdicion = Boolean(id);

  const [pacientes, setPacientes] = useState([]);
  const [terapeutas, setTerapeutas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    idPaciente: "",
    idTerapeuta: "",
    fecha: "",
    hora: "",
    modalidad: "presencial",
    estado: "solicitado",
    motivoConsulta: "",
    observacion: "",
  });

  useEffect(() => {
    async function cargarDatos() {
      try {
        setCargando(true);
        setError("");

        const respuestaOpciones = await api.get("/turnos/opciones");

        setPacientes(respuestaOpciones.data.pacientes);
        setTerapeutas(respuestaOpciones.data.terapeutas);

        if (esEdicion) {
          const respuestaTurno = await api.get(`/turnos/${id}`);
          const turno = respuestaTurno.data;

          setFormulario({
            idPaciente: turno.id_paciente,
            idTerapeuta: turno.id_terapeuta,
            fecha: turno.fecha ? turno.fecha.slice(0, 10) : "",
            hora: turno.hora || "",
            modalidad: turno.modalidad,
            estado: turno.estado,
            motivoConsulta: turno.motivo_consulta || "",
            observacion: turno.observacion || "",
          });
        }
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No se pudieron cargar los datos del formulario",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [esEdicion, id]);

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    setError("");

    if (
      !formulario.idPaciente ||
      !formulario.idTerapeuta ||
      !formulario.fecha ||
      !formulario.hora ||
      !formulario.modalidad ||
      !formulario.estado
    ) {
      setError("Completá todos los campos obligatorios");
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        idPaciente: Number(formulario.idPaciente),
        idTerapeuta: Number(formulario.idTerapeuta),
        fecha: formulario.fecha,
        hora: formulario.hora,
        modalidad: formulario.modalidad,
        estado: formulario.estado,
        motivoConsulta: formulario.motivoConsulta,
        observacion: formulario.observacion,
      };

      if (esEdicion) {
        await api.put(`/turnos/${id}`, datos);
      } else {
        await api.post("/turnos", datos);
      }

      navigate("/turnos", {
        state: {
          mensaje: esEdicion
            ? "Turno actualizado correctamente"
            : "Turno registrado correctamente",
        },
      });
    } catch (error) {
      setError(error.response?.data?.mensaje || "No se pudo guardar el turno");
    } finally {
      setGuardando(false);
    }
  };

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
        {esEdicion ? "Editar turno" : "Nuevo turno"}
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {esEdicion
          ? "Actualizá la información del turno terapéutico."
          : "Seleccioná el paciente, el terapeuta y el horario de atención."}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={manejarEnvio}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth required>
              <InputLabel>Paciente</InputLabel>

              <Select
                name="idPaciente"
                label="Paciente"
                value={formulario.idPaciente}
                onChange={manejarCambio}
              >
                {pacientes.map((paciente) => (
                  <MenuItem
                    key={paciente.id_paciente}
                    value={paciente.id_paciente}
                  >
                    {paciente.apellido}, {paciente.nombre} — DNI {paciente.dni}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Terapeuta</InputLabel>

              <Select
                name="idTerapeuta"
                label="Terapeuta"
                value={formulario.idTerapeuta}
                onChange={manejarCambio}
              >
                {terapeutas.map((terapeuta) => (
                  <MenuItem
                    key={terapeuta.id_terapeuta}
                    value={terapeuta.id_terapeuta}
                  >
                    {terapeuta.apellido}, {terapeuta.nombre}
                    {terapeuta.especialidad
                      ? ` — ${terapeuta.especialidad}`
                      : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
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

            <TextField
              fullWidth
              required
              type="time"
              label="Hora"
              name="hora"
              value={formulario.hora}
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
                <MenuItem value="solicitado">Solicitado</MenuItem>
                <MenuItem value="confirmado">Confirmado</MenuItem>
                <MenuItem value="realizado">Realizado</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
                <MenuItem value="reprogramado">Reprogramado</MenuItem>
                <MenuItem value="ausente">Ausente</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Motivo de consulta"
            name="motivoConsulta"
            value={formulario.motivoConsulta}
            onChange={manejarCambio}
            inputProps={{
              maxLength: 255,
            }}
            helperText={`${formulario.motivoConsulta.length}/255 caracteres`}
          />

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Observación"
            name="observacion"
            value={formulario.observacion}
            onChange={manejarCambio}
            inputProps={{
              maxLength: 255,
            }}
            helperText={`${formulario.observacion.length}/255 caracteres`}
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate("/turnos")}
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
                "Registrar turno"
              )}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

export default FormularioTurno;
