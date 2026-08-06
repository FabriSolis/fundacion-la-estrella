import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SchoolIcon from "@mui/icons-material/School";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import api from "../services/api";

function Dashboard() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const [indicadores, setIndicadores] = useState({
    usuarios: 0,
    pacientes: 0,
    alumnos: 0,
    turnosHoy: 0,
  });

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarIndicadores() {
      try {
        const respuesta = await api.get("/dashboard/indicadores");
        setIndicadores(respuesta.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No se pudieron cargar los indicadores",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarIndicadores();
  }, []);

  const tarjetas = [
    {
      titulo: "Usuarios",
      valor: indicadores.usuarios,
      icono: <PeopleIcon fontSize="large" />,
    },
    {
      titulo: "Pacientes",
      valor: indicadores.pacientes,
      icono: <FavoriteIcon fontSize="large" />,
    },
    {
      titulo: "Alumnos",
      valor: indicadores.alumnos,
      icono: <SchoolIcon fontSize="large" />,
    },
    {
      titulo: "Turnos de hoy",
      valor: indicadores.turnosHoy,
      icono: <CalendarMonthIcon fontSize="large" />,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Bienvenido, {usuario.nombre}. Este es el resumen general del sistema.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {cargando ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {tarjetas.map((tarjeta) => (
            <Grid item xs={12} sm={6} lg={3} key={tarjeta.titulo}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography color="text.secondary">
                        {tarjeta.titulo}
                      </Typography>

                      <Typography variant="h4" fontWeight="bold">
                        {tarjeta.valor}
                      </Typography>
                    </Box>

                    {tarjeta.icono}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Card sx={{ mt: 4, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Últimos movimientos
          </Typography>

          <Typography color="text.secondary">
            Todavía no hay movimientos registrados.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Dashboard;
