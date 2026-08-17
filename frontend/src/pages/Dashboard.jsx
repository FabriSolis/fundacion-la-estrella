import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../services/api";

const COLORES_TURNOS = {
  solicitado: "#1976d2",
  confirmado: "#2e7d32",
  realizado: "#7b1fa2",
  cancelado: "#d32f2f",
  reprogramado: "#ed6c02",
  ausente: "#616161",
};

function Dashboard() {
  const navigate = useNavigate();

  const [resumen, setResumen] = useState(null);
  const [pagosMes, setPagosMes] = useState([]);
  const [turnosEstado, setTurnosEstado] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarDashboard() {
      try {
        setError("");

        const [respuestaResumen, respuestaPagos, respuestaTurnos] =
          await Promise.all([
            api.get("/reportes/resumen"),
            api.get("/reportes/pagos-mes"),
            api.get("/reportes/turnos-estado"),
          ]);

        setResumen(respuestaResumen.data);
        setPagosMes(respuestaPagos.data);
        setTurnosEstado(respuestaTurnos.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje || "No se pudo cargar el dashboard",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarDashboard();
  }, []);

  function nombreMes(numero) {
    const meses = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    return meses[Number(numero) - 1] || numero;
  }

  function formatearDinero(valor) {
    return `$${Number(valor || 0).toLocaleString("es-AR")}`;
  }

  const pagosGrafico = useMemo(() => {
    return [...pagosMes]
      .reverse()
      .slice(-6)
      .map((item) => ({
        periodo: `${nombreMes(item.mes)} ${item.anio}`,
        total: Number(item.total || 0),
      }));
  }, [pagosMes]);

  const turnosGrafico = useMemo(() => {
    return turnosEstado.map((item) => ({
      ...item,
      cantidad: Number(item.cantidad || 0),
    }));
  }, [turnosEstado]);

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
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Resumen general de la actividad de la Fundación.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {resumen && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #1976d2",
              }}
            >
              <Typography color="text.secondary">Pacientes</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.pacientes_activos || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #2e7d32",
              }}
            >
              <Typography color="text.secondary">Alumnos</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.alumnos_activos || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #9c27b0",
              }}
            >
              <Typography color="text.secondary">Cursos</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.cursos_activos || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #ed6c02",
              }}
            >
              <Typography color="text.secondary">Turnos</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.turnos_confirmados || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #0288d1",
              }}
            >
              <Typography color="text.secondary">Clases</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.clases_programadas || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #388e3c",
              }}
            >
              <Typography color="text.secondary">Ingresos</Typography>

              <Typography variant="h5" fontWeight="bold">
                {formatearDinero(resumen.ingresos_totales)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Ingresos recientes
            </Typography>

            {pagosGrafico.length === 0 ? (
              <Typography color="text.secondary">
                No existen pagos registrados.
              </Typography>
            ) : (
              <Box sx={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={pagosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="periodo" />

                    <YAxis />

                    <Tooltip formatter={(value) => formatearDinero(value)} />

                    <Legend />

                    <Bar
                      dataKey="total"
                      name="Ingresos"
                      fill="#1976d2"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Turnos por estado
            </Typography>

            {turnosGrafico.length === 0 ? (
              <Typography color="text.secondary">
                No existen turnos registrados.
              </Typography>
            ) : (
              <Box sx={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={turnosGrafico}
                      dataKey="cantidad"
                      nameKey="estado"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                    >
                      {turnosGrafico.map((item) => (
                        <Cell
                          key={item.estado}
                          fill={COLORES_TURNOS[item.estado] || "#1976d2"}
                        />
                      ))}
                    </Pie>

                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Accesos rápidos
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          flexWrap="wrap"
        >
          <Button variant="contained" onClick={() => navigate("/turnos/nuevo")}>
            Nuevo turno
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate("/inscripciones/nueva")}
          >
            Nueva inscripción
          </Button>

          <Button variant="contained" onClick={() => navigate("/clases/nueva")}>
            Nueva clase
          </Button>

          <Button variant="contained" onClick={() => navigate("/pagos/nuevo")}>
            Nuevo pago
          </Button>

          <Button variant="outlined" onClick={() => navigate("/reportes")}>
            Ver reportes
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default Dashboard;
