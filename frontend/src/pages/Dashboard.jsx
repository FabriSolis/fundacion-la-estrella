import { Box, Card, CardContent, Grid, Typography } from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SchoolIcon from "@mui/icons-material/School";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

const indicadores = [
  {
    titulo: "Usuarios",
    valor: 1,
    icono: <PeopleIcon fontSize="large" />,
  },
  {
    titulo: "Pacientes",
    valor: 0,
    icono: <FavoriteIcon fontSize="large" />,
  },
  {
    titulo: "Alumnos",
    valor: 0,
    icono: <SchoolIcon fontSize="large" />,
  },
  {
    titulo: "Turnos de hoy",
    valor: 0,
    icono: <CalendarMonthIcon fontSize="large" />,
  },
];

function Dashboard() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Bienvenido, {usuario.nombre}. Este es el resumen general del sistema.
      </Typography>

      <Grid container spacing={3}>
        {indicadores.map((indicador) => (
          <Grid item xs={12} sm={6} lg={3} key={indicador.titulo}>
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
                      {indicador.titulo}
                    </Typography>

                    <Typography variant="h4" fontWeight="bold">
                      {indicador.valor}
                    </Typography>
                  </Box>

                  {indicador.icono}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
