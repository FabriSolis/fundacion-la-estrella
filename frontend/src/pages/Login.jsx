import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { Visibility, VisibilityOff } from "@mui/icons-material";

import api from "../services/api";
import logoEstrella from "../assets/logoestrella.png";
import { rutaInicial } from "../config/permisos";

function Login() {
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    email: "",
    contrasena: "",
  });

  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const { data } = await api.post("/auth/login", formulario);

      if (!data.token || !data.usuario) {
        throw new Error("Respuesta de inicio de sesión incompleta");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      navigate(rutaInicial(), { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.message ||
          "No se pudo iniciar sesión",
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #111827, #312e81, #7c3aed)",
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={12}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              component="img"
              src={logoEstrella}
              alt="Fundación La Estrella"
              sx={{
                width: 100,
                height: 100,
                objectFit: "contain",
                mb: 2,
              }}
            />

            <Typography variant="h5" fontWeight={800} sx={{ color: "#312e81" }}>
              Fundación La Estrella
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Sistema Integral de Gestión
            </Typography>
          </Box>

          <Typography
            variant="h6"
            fontWeight={700}
            textAlign="center"
            sx={{ mb: 3 }}
          >
            Iniciar sesión
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={iniciarSesion}>
            <TextField
              fullWidth
              required
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="username"
              value={formulario.email}
              onChange={manejarCambio}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              required
              label="Contraseña"
              name="contrasena"
              type={mostrarContrasena ? "text" : "password"}
              autoComplete="current-password"
              value={formulario.contrasena}
              onChange={manejarCambio}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        mostrarContrasena
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      onClick={() => setMostrarContrasena(!mostrarContrasena)}
                    >
                      {mostrarContrasena ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={cargando}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 700,
                bgcolor: "#6d28d9",
                "&:hover": {
                  bgcolor: "#5b21b6",
                },
              }}
            >
              {cargando ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Ingresar"
              )}
            </Button>
          </Box>

          <Typography
            variant="caption"
            display="block"
            textAlign="center"
            color="text.secondary"
            sx={{ mt: 4 }}
          >
            Fundación La Estrella
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
