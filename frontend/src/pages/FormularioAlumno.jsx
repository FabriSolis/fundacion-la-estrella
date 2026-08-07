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

function FormularioAlumno() {
  const navigate = useNavigate();
  const { id } = useParams();

  const esEdicion = Boolean(id);

  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    idUsuario: "",
    fechaIngreso: new Date().toISOString().substring(0, 10),
    estado: "activo",
  });

  useEffect(() => {
    async function cargarDatos() {
      try {
        setError("");

        if (esEdicion) {
          const respuesta = await api.get(`/alumnos/${id}`);
          const alumno = respuesta.data;

          setFormulario({
            idUsuario: alumno.id_usuario,
            fechaIngreso: alumno.fecha_ingreso
              ? String(alumno.fecha_ingreso).substring(0, 10)
              : "",
            estado: alumno.estado,
          });
        } else {
          const respuesta = await api.get("/alumnos/usuarios-disponibles");

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
      setError("Seleccioná un usuario con rol Alumno");
      return;
    }

    if (!formulario.fechaIngreso || !formulario.estado) {
      setError("Completá todos los campos obligatorios");
      return;
    }

    try {
      setGuardando(true);

      if (esEdicion) {
        await api.put(`/alumnos/${id}`, {
          fechaIngreso: formulario.fechaIngreso,
          estado: formulario.estado,
        });
      } else {
        await api.post("/alumnos", {
          idUsuario: Number(formulario.idUsuario),
          fechaIngreso: formulario.fechaIngreso,
          estado: formulario.estado,
        });
      }

      navigate("/alumnos", {
        state: {
          mensaje: esEdicion
            ? "Alumno actualizado correctamente"
            : "Alumno registrado correctamente",
        },
      });
    } catch (error) {
      setError(error.response?.data?.mensaje || "No se pudo guardar el alumno");
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
        {esEdicion ? "Editar alumno" : "Nuevo alumno"}
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {esEdicion
          ? "Actualizá la información académica del alumno."
          : "Asociá un usuario con rol Alumno y registrá su fecha de ingreso."}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!esEdicion && usuariosDisponibles.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No existen usuarios disponibles con rol Alumno. Primero registrá un
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
            label="Fecha de ingreso"
            name="fechaIngreso"
            value={formulario.fechaIngreso}
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
              <MenuItem value="activo">Activo</MenuItem>
              <MenuItem value="inactivo">Inactivo</MenuItem>
              <MenuItem value="egresado">Egresado</MenuItem>
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate("/alumnos")}
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
                "Registrar alumno"
              )}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

export default FormularioAlumno;
