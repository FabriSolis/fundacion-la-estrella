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

function FormularioPaciente() {
  const navigate = useNavigate();
  const { id } = useParams();

  const esEdicion = Boolean(id);

  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    idUsuario: "",
    fechaAlta: new Date().toISOString().slice(0, 10),
    motivoConsulta: "",
    estado: "activo",
  });

  useEffect(() => {
    async function cargarDatos() {
      try {
        setCargando(true);
        setError("");

        if (esEdicion) {
          const respuesta = await api.get(`/pacientes/${id}`);
          const paciente = respuesta.data;

          setFormulario({
            idUsuario: paciente.id_usuario,
            fechaAlta: paciente.fecha_alta
              ? paciente.fecha_alta.slice(0, 10)
              : "",
            motivoConsulta: paciente.motivo_consulta || "",
            estado: paciente.estado,
          });
        } else {
          const respuesta = await api.get("/pacientes/usuarios-disponibles");

          setUsuariosDisponibles(respuesta.data);
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

    if (!esEdicion && !formulario.idUsuario) {
      setError("Seleccioná un usuario con rol Paciente");
      return;
    }

    if (!formulario.fechaAlta || !formulario.estado) {
      setError("Completá los campos obligatorios");
      return;
    }

    try {
      setGuardando(true);

      if (esEdicion) {
        await api.put(`/pacientes/${id}`, {
          fechaAlta: formulario.fechaAlta,
          motivoConsulta: formulario.motivoConsulta,
          estado: formulario.estado,
        });
      } else {
        await api.post("/pacientes", {
          idUsuario: Number(formulario.idUsuario),
          fechaAlta: formulario.fechaAlta,
          motivoConsulta: formulario.motivoConsulta,
          estado: formulario.estado,
        });
      }

      navigate("/pacientes", {
        state: {
          mensaje: esEdicion
            ? "Paciente actualizado correctamente"
            : "Paciente registrado correctamente",
        },
      });
    } catch (error) {
      setError(
        error.response?.data?.mensaje || "No se pudo guardar el paciente",
      );
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
    <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 850 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {esEdicion ? "Editar paciente" : "Nuevo paciente"}
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {esEdicion
          ? "Actualizá la información terapéutica del paciente."
          : "Asociá un usuario con rol Paciente y completá su información."}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!esEdicion && usuariosDisponibles.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No existen usuarios disponibles con rol Paciente. Primero registrá un
          usuario desde el módulo Usuarios.
        </Alert>
      )}

      <Box component="form" onSubmit={manejarEnvio}>
        <Stack spacing={3}>
          {!esEdicion && (
            <FormControl fullWidth required>
              <InputLabel>Usuario asociado</InputLabel>

              <Select
                name="idUsuario"
                label="Usuario asociado"
                value={formulario.idUsuario}
                onChange={manejarCambio}
              >
                {usuariosDisponibles.map((usuario) => (
                  <MenuItem key={usuario.id_usuario} value={usuario.id_usuario}>
                    {usuario.apellido}, {usuario.nombre} — DNI {usuario.dni}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            required
            type="date"
            label="Fecha de alta"
            name="fechaAlta"
            value={formulario.fechaAlta}
            onChange={manejarCambio}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Motivo de consulta"
            name="motivoConsulta"
            value={formulario.motivoConsulta}
            onChange={manejarCambio}
            inputProps={{
              maxLength: 255,
            }}
            helperText={`${formulario.motivoConsulta.length}/255 caracteres`}
          />

          <FormControl fullWidth required>
            <InputLabel>Estado</InputLabel>

            <Select
              name="estado"
              label="Estado"
              value={formulario.estado}
              onChange={manejarCambio}
            >
              <MenuItem value="activo">Activo</MenuItem>
              <MenuItem value="inactivo">Inactivo</MenuItem>
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate("/pacientes")}
              disabled={guardando}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={
                guardando || (!esEdicion && usuariosDisponibles.length === 0)
              }
            >
              {guardando ? (
                <CircularProgress size={24} color="inherit" />
              ) : esEdicion ? (
                "Guardar cambios"
              ) : (
                "Registrar paciente"
              )}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

export default FormularioPaciente;
