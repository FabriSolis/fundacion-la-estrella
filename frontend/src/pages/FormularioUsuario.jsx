import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
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

function FormularioUsuario() {
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [cargandoRoles, setCargandoRoles] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    telefono: "",
    email: "",
    contrasena: "",
    idRol: "",
    estado: "activo",
  });

  useEffect(() => {
    async function cargarRoles() {
      try {
        const respuesta = await api.get("/roles");
        setRoles(respuesta.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje || "No se pudieron cargar los roles",
        );
      } finally {
        setCargandoRoles(false);
      }
    }

    cargarRoles();
  }, []);

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
      !formulario.nombre ||
      !formulario.apellido ||
      !formulario.dni ||
      !formulario.email ||
      !formulario.contrasena ||
      !formulario.idRol
    ) {
      setError("Completá todos los campos obligatorios");
      return;
    }

    try {
      setGuardando(true);

      await api.post("/usuarios", {
        ...formulario,
        idRol: Number(formulario.idRol),
      });

      navigate("/usuarios", {
        state: {
          mensaje: "Usuario creado correctamente",
        },
      });
    } catch (error) {
      setError(error.response?.data?.mensaje || "No se pudo crear el usuario");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Nuevo usuario
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Completá los datos para registrar un usuario en el sistema.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={manejarEnvio}>
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                required
                label="Nombre"
                name="nombre"
                value={formulario.nombre}
                onChange={manejarCambio}
              />

              <TextField
                fullWidth
                required
                label="Apellido"
                name="apellido"
                value={formulario.apellido}
                onChange={manejarCambio}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                required
                label="DNI"
                name="dni"
                value={formulario.dni}
                onChange={manejarCambio}
              />

              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                value={formulario.telefono}
                onChange={manejarCambio}
              />
            </Stack>

            <TextField
              fullWidth
              required
              type="email"
              label="Correo electrónico"
              name="email"
              value={formulario.email}
              onChange={manejarCambio}
            />

            <TextField
              fullWidth
              required
              type="password"
              label="Contraseña"
              name="contrasena"
              value={formulario.contrasena}
              onChange={manejarCambio}
              helperText="Utilizá al menos 8 caracteres."
            />

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Rol</InputLabel>

                <Select
                  name="idRol"
                  label="Rol"
                  value={formulario.idRol}
                  onChange={manejarCambio}
                  disabled={cargandoRoles}
                >
                  {roles.map((rol) => (
                    <MenuItem key={rol.id_rol} value={rol.id_rol}>
                      {rol.nombre}
                    </MenuItem>
                  ))}
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
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                  <MenuItem value="bloqueado">Bloqueado</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate("/usuarios")}
                disabled={guardando}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={guardando || cargandoRoles}
              >
                {guardando ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Guardar usuario"
                )}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}

export default FormularioUsuario;
