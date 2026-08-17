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

function FormularioDocente() {
  const navigate = useNavigate();
  const { id } = useParams();

  const esEdicion = Boolean(id);

  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    idUsuario: "",
    especialidad: "",
    estado: "activo",
  });

  useEffect(() => {
    async function cargarDatos() {
      try {
        setError("");

        if (esEdicion) {
          const respuesta = await api.get(`/docentes/${id}`);

          const docente = respuesta.data;

          setFormulario({
            idUsuario: docente.id_usuario,
            especialidad: docente.especialidad || "",
            estado: docente.estado,
          });
        } else {
          const respuesta = await api.get("/docentes/usuarios-disponibles");

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

    if (!esEdicion && !formulario.idUsuario) {
      setError("Seleccioná un usuario con rol Docente");
      return;
    }

    try {
      setGuardando(true);

      if (esEdicion) {
        await api.put(`/docentes/${id}`, {
          especialidad: formulario.especialidad,
          estado: formulario.estado,
        });
      } else {
        await api.post("/docentes", {
          idUsuario: Number(formulario.idUsuario),
          especialidad: formulario.especialidad,
          estado: formulario.estado,
        });
      }

      navigate("/docentes", {
        state: {
          mensaje: esEdicion
            ? "Docente actualizado correctamente"
            : "Docente registrado correctamente",
        },
      });
    } catch (error) {
      setError(
        error.response?.data?.mensaje || "No se pudo guardar el docente",
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
        {esEdicion ? "Editar docente" : "Nuevo docente"}
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {esEdicion
          ? "Actualizá la información del docente."
          : "Asociá un usuario con rol Docente para crear su perfil."}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!esEdicion && usuariosDisponibles.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No hay usuarios disponibles con rol Docente. Primero creá un usuario
          con ese rol desde Usuarios.
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
            label="Especialidad"
            name="especialidad"
            value={formulario.especialidad}
            onChange={manejarCambio}
            placeholder="Ej: Liberación de la Memoria Celular"
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
              onClick={() => navigate("/docentes")}
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
                "Registrar docente"
              )}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

export default FormularioDocente;
