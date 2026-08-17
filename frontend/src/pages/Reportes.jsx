import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

const COLORES = [
  "#1976d2",
  "#2e7d32",
  "#ed6c02",
  "#9c27b0",
  "#d32f2f",
  "#0288d1",
  "#7b1fa2",
  "#388e3c",
];

const COLORES_TURNOS = {
  solicitado: "#1976d2",
  confirmado: "#2e7d32",
  realizado: "#7b1fa2",
  cancelado: "#d32f2f",
  reprogramado: "#ed6c02",
  ausente: "#616161",
};

const COLORES_ASISTENCIA = {
  Presentes: "#2e7d32",
  Ausentes: "#d32f2f",
  Justificados: "#ed6c02",
};

function Reportes() {
  const [resumen, setResumen] = useState(null);
  const [pagosMes, setPagosMes] = useState([]);
  const [turnosEstado, setTurnosEstado] = useState([]);
  const [inscripcionesCurso, setInscripcionesCurso] = useState([]);
  const [asistenciaCurso, setAsistenciaCurso] = useState([]);

  const [idCursoSeleccionado, setIdCursoSeleccionado] = useState("");

  const [clasesCurso, setClasesCurso] = useState([]);

  const [idClaseSeleccionada, setIdClaseSeleccionada] = useState("");

  const [detalleClase, setDetalleClase] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [cargandoClases, setCargandoClases] = useState(false);

  const [cargandoDetalle, setCargandoDetalle] = useState(false);

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

  useEffect(() => {
    async function cargarClases() {
      if (!idCursoSeleccionado) {
        setClasesCurso([]);
        setIdClaseSeleccionada("");
        setDetalleClase(null);
        return;
      }

      try {
        setCargandoClases(true);
        setError("");

        const respuesta = await api.get(
          `/reportes/clases-curso/${idCursoSeleccionado}`,
        );

        setClasesCurso(respuesta.data);
        setIdClaseSeleccionada("");
        setDetalleClase(null);
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No se pudieron cargar las clases del curso",
        );
      } finally {
        setCargandoClases(false);
      }
    }

    cargarClases();
  }, [idCursoSeleccionado]);

  useEffect(() => {
    async function cargarDetalleClase() {
      if (!idClaseSeleccionada) {
        setDetalleClase(null);
        return;
      }

      try {
        setCargandoDetalle(true);
        setError("");

        const respuesta = await api.get(
          `/reportes/asistencia-clase/${idClaseSeleccionada}`,
        );

        setDetalleClase(respuesta.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No se pudo cargar la asistencia de la clase",
        );
      } finally {
        setCargandoDetalle(false);
      }
    }

    cargarDetalleClase();
  }, [idClaseSeleccionada]);

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

  function formatearDinero(valor) {
    return `$${Number(valor || 0).toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatearFecha(fecha) {
    if (!fecha) return "-";

    return String(fecha).substring(0, 10).split("-").reverse().join("/");
  }

  const pagosGrafico = useMemo(() => {
    return [...pagosMes].reverse().map((item) => ({
      ...item,
      total: Number(item.total || 0),
      cantidad_pagos: Number(item.cantidad_pagos || 0),
      periodo: `${nombreMes(item.mes)} ${item.anio}`,
    }));
  }, [pagosMes]);

  const turnosGrafico = useMemo(() => {
    return turnosEstado.map((item) => ({
      ...item,
      cantidad: Number(item.cantidad || 0),
    }));
  }, [turnosEstado]);

  const inscripcionesGrafico = useMemo(() => {
    return inscripcionesCurso.map((curso) => ({
      ...curso,

      cantidad_inscriptos: Number(curso.cantidad_inscriptos || 0),

      curso_label:
        curso.nombre?.length > 18
          ? `${curso.nombre.substring(0, 18)}...`
          : curso.nombre,
    }));
  }, [inscripcionesCurso]);

  const asistenciaGrafico = useMemo(() => {
    return asistenciaCurso.map((curso) => ({
      ...curso,

      presentes: Number(curso.presentes || 0),

      ausentes: Number(curso.ausentes || 0),

      justificados: Number(curso.justificados || 0),

      porcentaje_asistencia: Number(curso.porcentaje_asistencia || 0),

      curso_label:
        curso.nombre?.length > 18
          ? `${curso.nombre.substring(0, 18)}...`
          : curso.nombre,
    }));
  }, [asistenciaCurso]);

  const asistenciaClaseGrafico = useMemo(() => {
    if (!detalleClase?.resumen) {
      return [];
    }

    return [
      {
        nombre: "Presentes",
        cantidad: Number(detalleClase.resumen.presentes || 0),
      },
      {
        nombre: "Ausentes",
        cantidad: Number(detalleClase.resumen.ausentes || 0),
      },
      {
        nombre: "Justificados",
        cantidad: Number(detalleClase.resumen.justificados || 0),
      },
    ].filter((item) => item.cantidad > 0);
  }, [detalleClase]);

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
        Información general de las áreas terapéutica, educativa y
        administrativa.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {resumen && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #1976d2",
              }}
            >
              <Typography color="text.secondary">Pacientes activos</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.pacientes_activos || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #2e7d32",
              }}
            >
              <Typography color="text.secondary">Alumnos activos</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.alumnos_activos || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #9c27b0",
              }}
            >
              <Typography color="text.secondary">Cursos activos</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.cursos_activos || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #388e3c",
              }}
            >
              <Typography color="text.secondary">
                Ingresos registrados
              </Typography>

              <Typography variant="h4" fontWeight="bold">
                {formatearDinero(resumen.ingresos_totales)}
              </Typography>
            </Paper>
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #0288d1",
              }}
            >
              <Typography color="text.secondary">Terapeutas activos</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.terapeutas_activos || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #7b1fa2",
              }}
            >
              <Typography color="text.secondary">Docentes activos</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.docentes_activos || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #ed6c02",
              }}
            >
              <Typography color="text.secondary">Turnos confirmados</Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.turnos_confirmados || 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: "5px solid #d32f2f",
              }}
            >
              <Typography color="text.secondary">
                Inscripciones activas
              </Typography>

              <Typography variant="h4" fontWeight="bold">
                {resumen.inscripciones_activas || 0}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Stack spacing={4}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                height: "100%",
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Ingresos por mes
              </Typography>

              {pagosGrafico.length === 0 ? (
                <Typography color="text.secondary">
                  No existen pagos registrados.
                </Typography>
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: 350,
                  }}
                >
                  <ResponsiveContainer>
                    <BarChart data={pagosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis
                        dataKey="periodo"
                        tick={{
                          fontSize: 12,
                        }}
                      />

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

          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                height: "100%",
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Distribución de turnos
              </Typography>

              {turnosGrafico.length === 0 ? (
                <Typography color="text.secondary">
                  No existen turnos registrados.
                </Typography>
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: 350,
                  }}
                >
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={turnosGrafico}
                        dataKey="cantidad"
                        nameKey="estado"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ estado, cantidad }) =>
                          `${estado}: ${cantidad}`
                        }
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

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                height: "100%",
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Alumnos inscriptos por curso
              </Typography>

              {inscripcionesGrafico.length === 0 ? (
                <Typography color="text.secondary">
                  No existen cursos registrados.
                </Typography>
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: 350,
                  }}
                >
                  <ResponsiveContainer>
                    <BarChart
                      data={inscripcionesGrafico}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 0,
                        bottom: 40,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis
                        dataKey="curso_label"
                        angle={-20}
                        textAnchor="end"
                        interval={0}
                        height={70}
                      />

                      <YAxis allowDecimals={false} />

                      <Tooltip />
                      <Legend />

                      <Bar
                        dataKey="cantidad_inscriptos"
                        name="Inscriptos"
                        radius={[6, 6, 0, 0]}
                      >
                        {inscripcionesGrafico.map((curso, index) => (
                          <Cell
                            key={curso.id_curso}
                            fill={COLORES[index % COLORES.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                height: "100%",
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Asistencia general por curso
              </Typography>

              {asistenciaGrafico.length === 0 ? (
                <Typography color="text.secondary">
                  No existen registros de asistencia.
                </Typography>
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: 350,
                  }}
                >
                  <ResponsiveContainer>
                    <BarChart
                      data={asistenciaGrafico}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 0,
                        bottom: 40,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis
                        dataKey="curso_label"
                        angle={-20}
                        textAnchor="end"
                        interval={0}
                        height={70}
                      />

                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(valor) => `${valor}%`}
                      />

                      <Tooltip
                        formatter={(value) => `${Number(value).toFixed(2)}%`}
                      />

                      <Legend />

                      <Bar
                        dataKey="porcentaje_asistencia"
                        name="% Asistencia"
                        fill="#2e7d32"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
            Asistencia por clase
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Seleccioná un curso y una clase para consultar el detalle de
            asistencia.
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Curso</InputLabel>

                <Select
                  label="Curso"
                  value={idCursoSeleccionado}
                  onChange={(evento) =>
                    setIdCursoSeleccionado(evento.target.value)
                  }
                >
                  {inscripcionesCurso.map((curso) => (
                    <MenuItem key={curso.id_curso} value={curso.id_curso}>
                      {curso.nombre} — {curso.nivel}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl
                fullWidth
                disabled={!idCursoSeleccionado || cargandoClases}
              >
                <InputLabel>Clase</InputLabel>

                <Select
                  label="Clase"
                  value={idClaseSeleccionada}
                  onChange={(evento) =>
                    setIdClaseSeleccionada(evento.target.value)
                  }
                >
                  {clasesCurso.map((clase) => (
                    <MenuItem key={clase.id_clase} value={clase.id_clase}>
                      {formatearFecha(clase.fecha)} — {clase.hora_inicio}
                      {clase.tema ? ` — ${clase.tema}` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {cargandoDetalle && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 5,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {!cargandoDetalle && detalleClase && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" fontWeight="bold">
                {detalleClase.clase.curso_nombre}
              </Typography>

              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {formatearFecha(detalleClase.clase.fecha)} —{" "}
                {detalleClase.clase.hora_inicio} a {detalleClase.clase.hora_fin}
                {detalleClase.clase.tema ? ` — ${detalleClase.clase.tema}` : ""}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderLeft: "5px solid #2e7d32",
                    }}
                  >
                    <Typography color="text.secondary">Presentes</Typography>

                    <Typography variant="h5" fontWeight="bold">
                      {detalleClase.resumen.presentes || 0}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderLeft: "5px solid #d32f2f",
                    }}
                  >
                    <Typography color="text.secondary">Ausentes</Typography>

                    <Typography variant="h5" fontWeight="bold">
                      {detalleClase.resumen.ausentes || 0}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderLeft: "5px solid #ed6c02",
                    }}
                  >
                    <Typography color="text.secondary">Justificados</Typography>

                    <Typography variant="h5" fontWeight="bold">
                      {detalleClase.resumen.justificados || 0}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderLeft: "5px solid #1976d2",
                    }}
                  >
                    <Typography color="text.secondary">% Asistencia</Typography>

                    <Typography variant="h5" fontWeight="bold">
                      {Number(
                        detalleClase.resumen.porcentaje_asistencia || 0,
                      ).toFixed(2)}
                      %
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid
                  size={{
                    xs: 12,
                    lg: 5,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      height: "100%",
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      Distribución de asistencia
                    </Typography>

                    {asistenciaClaseGrafico.length === 0 ? (
                      <Typography color="text.secondary">
                        No existen asistencias registradas para esta clase.
                      </Typography>
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: 320,
                        }}
                      >
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={asistenciaClaseGrafico}
                              dataKey="cantidad"
                              nameKey="nombre"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={({ nombre, cantidad }) =>
                                `${nombre}: ${cantidad}`
                              }
                            >
                              {asistenciaClaseGrafico.map((item) => (
                                <Cell
                                  key={item.nombre}
                                  fill={
                                    COLORES_ASISTENCIA[item.nombre] || "#1976d2"
                                  }
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

                <Grid
                  size={{
                    xs: 12,
                    lg: 7,
                  }}
                >
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Alumno</TableCell>

                          <TableCell>DNI</TableCell>

                          <TableCell>Estado</TableCell>

                          <TableCell>Observación</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {detalleClase.alumnos.map((alumno) => (
                          <TableRow key={alumno.id_asistencia} hover>
                            <TableCell>
                              {alumno.apellido}, {alumno.nombre}
                            </TableCell>

                            <TableCell>{alumno.dni}</TableCell>

                            <TableCell>{alumno.estado_asistencia}</TableCell>

                            <TableCell>{alumno.observacion || "-"}</TableCell>
                          </TableRow>
                        ))}

                        {detalleClase.alumnos.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              No existen asistencias registradas.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>

        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Asistencia general por curso
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
                  <TableCell>Total</TableCell>
                  <TableCell>% Asistencia</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {asistenciaCurso.map((curso) => (
                  <TableRow key={curso.id_curso} hover>
                    <TableCell>{curso.nombre}</TableCell>

                    <TableCell>{curso.nivel}</TableCell>

                    <TableCell>{curso.presentes || 0}</TableCell>

                    <TableCell>{curso.ausentes || 0}</TableCell>

                    <TableCell>{curso.justificados || 0}</TableCell>

                    <TableCell>{curso.total_registros || 0}</TableCell>

                    <TableCell>
                      {Number(curso.porcentaje_asistencia || 0).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Detalle de pagos por mes
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

                    <TableCell>{formatearDinero(item.total)}</TableCell>
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
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
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
                  <TableRow key={item.estado} hover>
                    <TableCell>{item.estado}</TableCell>

                    <TableCell>{item.cantidad}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
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
                  <TableRow key={curso.id_curso} hover>
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
      </Stack>
    </Box>
  );
}

export default Reportes;
