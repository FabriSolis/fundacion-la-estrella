import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    email: "",
    contrasena: "",
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

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
    setCargando(true);

    try {
      const respuesta = await api.post("/auth/login", formulario);

      localStorage.setItem("token", respuesta.data.token);
      localStorage.setItem("usuario", JSON.stringify(respuesta.data.usuario));

      navigate("/dashboard");
    } catch (error) {
      setError(error.response?.data?.mensaje || "No se pudo iniciar sesión");
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
        background: "linear-gradient(135deg, #ede7f6 0%, #ffffff 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 5,
            borderRadius: 4,
          }}
        >
          <Typography
            variant="h4"
            align="center"
            fontWeight="bold"
            gutterBottom
          >
            Fundación La Estrella
          </Typography>

          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Inicio de sesión
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={manejarEnvio} noValidate>
            <TextField
              fullWidth
              required
              margin="normal"
              label="Correo electrónico"
              name="email"
              type="email"
              value={formulario.email}
              onChange={manejarCambio}
            />

            <TextField
              fullWidth
              required
              margin="normal"
              label="Contraseña"
              name="contrasena"
              type="password"
              value={formulario.contrasena}
              onChange={manejarCambio}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={cargando}
              sx={{
                mt: 3,
                py: 1.4,
                borderRadius: 2,
              }}
            >
              {cargando ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
