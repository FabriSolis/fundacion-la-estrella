import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import api from "../services/api";

function Reportes() {
  const [resumen, setResumen] = useState(null);
  const [pagosMes, setPagosMes] = useState([]);
  const [turnosEstado, setTurnosEstado] = useState([]);
  const [inscripcionesCurso, setInscripcionesCurso] = useState([]);
  const [asistenciaCurso, setAsistenciaCurso] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarReportes() {
      try {
        setError("");

        const [
          respuestaResumen,
          respuestaPagos,
          respuestaTurnos,
          respuestaInscripciones,
          respuestaAsistencia,
        ] = await Promise.all([
          api.get("/reportes/resumen"),
          api.get("/reportes/pagos-mes"),
          api.get("/reportes/turnos-estado"),
          api.get("/reportes/inscripciones-curso"),
          api.get("/reportes/asistencia-curso"),
        ]);

        setResumen(respuestaResumen.data);
        setPagosMes(respuestaPagos.data);
        setTurnosEstado(respuestaTurnos.data);
        setInscripcionesCurso(respuestaInscripciones.data);
        setAsistenciaCurso(respuestaAsistencia.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje || "No se pudieron cargar los reportes",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarReportes();
  }, []);

  function nombreMes(numero) {
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    return meses[Number(numero) - 1] || numero;
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
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Reportes e indicadores
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Información general sobre la actividad de la Fundación.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {resumen && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography color="text.secondary">Pacientes activos</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.pacientes_activos}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography color="text.secondary">Alumnos activos</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.alumnos_activos}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography color="text.secondary">Cursos activos</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.cursos_activos}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography color="text.secondary">
                Ingresos registrados
              </Typography>

              <Typography variant="h4" fontWeight="bold">
                ${Number(resumen.ingresos_totales || 0).toLocaleString("es-AR")}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Pagos por mes
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Período</TableCell>
                  <TableCell>Cantidad de pagos</TableCell>
                  <TableCell>Total</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {pagosMes.map((item) => (
                  <TableRow key={`${item.anio}-${item.mes}`} hover>
                    <TableCell>
                      {nombreMes(item.mes)} {item.anio}
                    </TableCell>

                    <TableCell>{item.cantidad_pagos}</TableCell>

                    <TableCell>
                      ${Number(item.total || 0).toLocaleString("es-AR")}
                    </TableCell>
                  </TableRow>
                ))}

                {pagosMes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No existen pagos registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Turnos por estado
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Estado</TableCell>
                  <TableCell>Cantidad</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {turnosEstado.map((item) => (
                  <TableRow key={item.estado}>
                    <TableCell>{item.estado}</TableCell>
                    <TableCell>{item.cantidad}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Inscripciones por curso
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Curso</TableCell>
                  <TableCell>Nivel</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Inscriptos</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {inscripcionesCurso.map((curso) => (
                  <TableRow key={curso.id_curso}>
                    <TableCell>{curso.nombre}</TableCell>
                    <TableCell>{curso.nivel}</TableCell>
                    <TableCell>{curso.estado}</TableCell>
                    <TableCell>{curso.cantidad_inscriptos}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Asistencia por curso
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Curso</TableCell>
                  <TableCell>Nivel</TableCell>
                  <TableCell>Presentes</TableCell>
                  <TableCell>Ausentes</TableCell>
                  <TableCell>Justificados</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {asistenciaCurso.map((curso) => (
                  <TableRow key={curso.id_curso}>
                    <TableCell>{curso.nombre}</TableCell>
                    <TableCell>{curso.nivel}</TableCell>
                    <TableCell>{curso.presentes || 0}</TableCell>
                    <TableCell>{curso.ausentes || 0}</TableCell>
                    <TableCell>{curso.justificados || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
    </Box>
  );
}

export default Reportes;
