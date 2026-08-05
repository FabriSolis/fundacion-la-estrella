import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <Container sx={{ py: 5 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Panel principal
        </Typography>

        <Typography sx={{ mb: 1 }}>
          Bienvenido, {usuario.nombre || "usuario"}.
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Rol: {usuario.rol || "Sin rol"}
        </Typography>

        <Box>
          <Button variant="outlined" color="error" onClick={cerrarSesion}>
            Cerrar sesión
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Dashboard;
