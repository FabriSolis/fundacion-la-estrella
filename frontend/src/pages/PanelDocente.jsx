import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import api from "../services/api";

// ==========================================
// FORMATEAR FECHAS
// ==========================================

function formatearFecha(fecha) {
  if (!fecha) return "Sin registrar";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "Fecha no disponible";
  }

  return valor.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ==========================================
// COLORES DE ESTADOS
// ==========================================

function colorEstado(estado) {
  const colores = {
    activo: "success",
    inactivo: "default",
    pendiente: "warning",
    planificado: "info",
    "en curso": "info",
    finalizado: "default",
    finalizada: "default",
    cancelado: "error",
    cancelada: "error",
    programada: "info",
    dictada: "success",
    suspendida: "warning",
  };

  return colores[estado?.toLowerCase()] || "default";
}

// ==========================================
// VALIDAR ENLACES VIRTUALES
// ==========================================

function enlaceSeguro(enlace) {
  if (!enlace) return null;

  try {
    const url = new URL(enlace);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch {
    return null;
  }

  return null;
}

// ==========================================
// PANEL DOCENTE
// ==========================================

function PanelDocente() {
  const navigate = useNavigate();

  const [docente, setDocente] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [clases, setClases] = useState([]);
  const [alumnos, setAlumnos] = useState([]);

  const [cargando, setCargando] = useState(true);

  const [errorPerfil, setErrorPerfil] = useState("");
  const [errorCursos, setErrorCursos] = useState("");
  const [errorClases, setErrorClases] = useState("");
  const [errorAlumnos, setErrorAlumnos] = useState("");

  // ========================================
  // CARGAR DATOS
  // ========================================

  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      try {
        const resultados = await Promise.allSettled([
          api.get("/docentes/mi-perfil"),
          api.get("/cursos/mis-cursos"),
          api.get("/clases/mis-clases-docente"),
          api.get("/inscripciones/mis-alumnos-docente"),
        ]);

        if (!activo) return;

        const [
          resultadoPerfil,
          resultadoCursos,
          resultadoClases,
          resultadoAlumnos,
        ] = resultados;

        // PERFIL
        if (resultadoPerfil.status === "fulfilled") {
          setDocente(resultadoPerfil.value.data);
        } else {
          setErrorPerfil(
            resultadoPerfil.reason?.response?.data?.mensaje ||
              "No se pudo cargar tu perfil.",
          );
        }

        // CURSOS
        if (resultadoCursos.status === "fulfilled") {
          const datos = resultadoCursos.value.data;

          setCursos(Array.isArray(datos) ? datos : []);
        } else {
          setErrorCursos(
            resultadoCursos.reason?.response?.data?.mensaje ||
              "No se pudieron cargar tus cursos.",
          );
        }

        // CLASES
        if (resultadoClases.status === "fulfilled") {
          const datos = resultadoClases.value.data;

          setClases(Array.isArray(datos) ? datos : []);
        } else {
          setErrorClases(
            resultadoClases.reason?.response?.data?.mensaje ||
              "No se pudieron cargar tus clases.",
          );
        }

        // ALUMNOS ASIGNADOS A MIS CURSOS
        if (resultadoAlumnos.status === "fulfilled") {
          const datos = resultadoAlumnos.value.data;

          setAlumnos(Array.isArray(datos) ? datos : []);
        } else {
          setErrorAlumnos(
            resultadoAlumnos.reason?.response?.data?.mensaje ||
              "No se pudieron cargar los alumnos de tus cursos.",
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarDatos();

    return () => {
      activo = false;
    };
  }, []);

  // ========================================
  // IR A TOMAR ASISTENCIA
  // ========================================

  function irATomarAsistencia(idClase) {
    navigate(`/clases/${idClase}/asistencia`);
  }

  // ========================================
  // AGRUPAR ALUMNOS POR CURSO
  // ========================================

  const cursosParaMostrar =
    cursos.length > 0
      ? cursos
      : Array.from(
          new Map(
            alumnos.map((alumno) => [
              String(alumno.id_curso),
              {
                id_curso: alumno.id_curso,
                nombre: alumno.curso_nombre,
                nivel: alumno.curso_nivel,
              },
            ]),
          ).values(),
        );

  const alumnosPorCurso = cursosParaMostrar.map((curso) => ({
    ...curso,
    inscriptos: alumnos.filter(
      (alumno) => String(alumno.id_curso) === String(curso.id_curso),
    ),
  }));

  const totalAlumnos = new Set(
    alumnos.map((alumno) => String(alumno.id_alumno)),
  ).size;

  // ========================================
  // PANTALLA DE CARGA
  // ========================================

  if (cargando) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", pb: 4 }}>
      {/* ENCABEZADO */}

      <Typography variant="h4" fontWeight={700} gutterBottom>
        Mi espacio docente
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Fundación La Estrella
      </Typography>

      {/* ================================= */}
      {/* MI PERFIL */}
      {/* ================================= */}

      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          mb: 4,
        }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Mi perfil
        </Typography>

        {errorPerfil && <Alert severity="warning">{errorPerfil}</Alert>}

        {docente && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                Nombre completo
              </Typography>

              <Typography fontWeight={600}>
                {docente.nombre} {docente.apellido}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Correo electrónico
              </Typography>

              <Typography sx={{ overflowWrap: "anywhere" }}>
                {docente.email || "Sin registrar"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Especialidad
              </Typography>

              <Typography>
                {docente.especialidad || "Sin especificar"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Teléfono
              </Typography>

              <Typography>{docente.telefono || "Sin registrar"}</Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Estado del docente
              </Typography>

              <Chip
                label={docente.estado || "Sin registrar"}
                color={colorEstado(docente.estado)}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
        )}
      </Paper>

      {/* ================================= */}
      {/* RESUMEN */}
      {/* ================================= */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, 1fr)",
          },
          gap: 3,
          mb: 4,
        }}
      >
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="h3" fontWeight={700} color="primary">
            {errorCursos ? "—" : cursos.length}
          </Typography>

          <Typography color="text.secondary">Cursos asignados</Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="h3" fontWeight={700} color="primary">
            {errorClases ? "—" : clases.length}
          </Typography>

          <Typography color="text.secondary">Clases registradas</Typography>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="h3" fontWeight={700} color="primary">
            {errorAlumnos ? "—" : totalAlumnos}
          </Typography>

          <Typography color="text.secondary">Alumnos a cargo</Typography>
        </Paper>
      </Box>

      {/* ================================= */}
      {/* MIS CURSOS */}
      {/* ================================= */}

      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Mis cursos
      </Typography>

      {errorCursos && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {errorCursos}
        </Alert>
      )}

      {!errorCursos && cursos.length === 0 && (
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            mb: 4,
          }}
        >
          <Typography color="text.secondary">
            Todavía no tenés cursos asignados. Cuando la administración te
            asigne uno, aparecerá en esta sección.
          </Typography>
        </Paper>
      )}

      {!errorCursos && cursos.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
            },
            gap: 3,
            mb: 4,
          }}
        >
          {cursos.map((curso) => (
            <Paper
              key={curso.id_curso}
              sx={{
                p: 3,
                borderRadius: 3,
                height: "100%",
                boxSizing: "border-box",
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                {curso.nombre}
              </Typography>

              <Chip
                label={curso.estado || "Sin estado"}
                color={colorEstado(curso.estado)}
                size="small"
                sx={{ mb: 2 }}
              />

              <Typography sx={{ mb: 1 }}>
                <strong>Nivel:</strong> {curso.nivel || "Sin especificar"}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                <strong>Modalidad:</strong>{" "}
                {curso.modalidad || "Sin especificar"}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                <strong>Inicio:</strong> {formatearFecha(curso.fecha_inicio)}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                <strong>Finalización:</strong> {formatearFecha(curso.fecha_fin)}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                <strong>Duración:</strong>{" "}
                {curso.duracion_meses
                  ? `${curso.duracion_meses} meses`
                  : "Sin especificar"}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                <strong>Cupo:</strong> {curso.cupo ?? "Sin especificar"}
              </Typography>

              {curso.descripcion && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  {curso.descripcion}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}

      {/* ================================= */}
      {/* MIS ALUMNOS */}
      {/* ================================= */}

      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Mis alumnos
      </Typography>

      {errorAlumnos && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {errorAlumnos}
        </Alert>
      )}

      {!errorAlumnos && alumnosPorCurso.length === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
          <Typography color="text.secondary">
            Todavía no tenés alumnos asignados a tus cursos.
          </Typography>
        </Paper>
      )}

      {!errorAlumnos && alumnosPorCurso.length > 0 && (
        <Box sx={{ display: "grid", gap: 3, mb: 4 }}>
          {alumnosPorCurso.map((curso) => (
            <Paper key={curso.id_curso} sx={{ p: 3, borderRadius: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  flexWrap: "wrap",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {curso.nombre || "Curso sin nombre"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nivel: {curso.nivel || "Sin especificar"}
                  </Typography>
                </Box>

                <Chip
                  label={`${curso.inscriptos.length} ${
                    curso.inscriptos.length === 1 ? "alumno" : "alumnos"
                  }`}
                  color="primary"
                  variant="outlined"
                />
              </Box>

              {curso.inscriptos.length === 0 ? (
                <Typography color="text.secondary">
                  Este curso todavía no tiene alumnos inscriptos.
                </Typography>
              ) : (
                <Box sx={{ display: "grid", gap: 2 }}>
                  {curso.inscriptos.map((inscripcion) => (
                    <Box
                      key={inscripcion.id_inscripcion}
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Typography fontWeight={600}>
                          {inscripcion.alumno_nombre}{" "}
                          {inscripcion.alumno_apellido}
                        </Typography>

                        <Chip
                          label={inscripcion.estado || "Sin estado"}
                          color={colorEstado(inscripcion.estado)}
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>DNI:</strong>{" "}
                        {inscripcion.alumno_dni || "Sin registrar"}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ overflowWrap: "anywhere" }}
                      >
                        <strong>Correo:</strong>{" "}
                        {inscripcion.alumno_email || "Sin registrar"}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      )}

      {/* ================================= */}
      {/* MIS CLASES */}
      {/* ================================= */}

      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Mis clases
      </Typography>

      {errorClases && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {errorClases}
        </Alert>
      )}

      {!errorClases && clases.length === 0 && (
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
          }}
        >
          <Typography color="text.secondary">
            Todavía no tenés clases registradas para tus cursos.
          </Typography>
        </Paper>
      )}

      {!errorClases && clases.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
            },
            gap: 3,
          }}
        >
          {clases.map((clase) => {
            const enlace = enlaceSeguro(clase.enlace_virtual);

            const puedeIngresar =
              enlace &&
              clase.estado === "programada" &&
              ["virtual", "mixta"].includes(clase.modalidad);

            return (
              <Paper
                key={clase.id_clase}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  height: "100%",
                  boxSizing: "border-box",
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  {clase.curso_nombre}
                </Typography>

                <Chip
                  label={clase.estado || "Sin estado"}
                  color={colorEstado(clase.estado)}
                  size="small"
                  sx={{ mb: 2 }}
                />

                <Typography sx={{ mb: 1 }}>
                  <strong>Tema:</strong> {clase.tema || "Sin especificar"}
                </Typography>

                <Typography sx={{ mb: 1 }}>
                  <strong>Fecha:</strong> {formatearFecha(clase.fecha)}
                </Typography>

                <Typography sx={{ mb: 1 }}>
                  <strong>Horario:</strong> {clase.hora_inicio} a{" "}
                  {clase.hora_fin}
                </Typography>

                <Typography sx={{ mb: 1 }}>
                  <strong>Modalidad:</strong> {clase.modalidad}
                </Typography>

                <Typography sx={{ mb: 1 }}>
                  <strong>Nivel:</strong>{" "}
                  {clase.curso_nivel || "Sin especificar"}
                </Typography>

                {/* BOTONES DE LA CLASE */}

                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={2}
                  sx={{ mt: 3 }}
                >
                  {/* TOMAR ASISTENCIA */}

                  <Button
                    variant="contained"
                    onClick={() => irATomarAsistencia(clase.id_clase)}
                  >
                    Tomar asistencia
                  </Button>

                  {/* INGRESAR A CLASE VIRTUAL */}

                  {puedeIngresar && (
                    <Button
                      variant="outlined"
                      href={enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ingresar a clase virtual
                    </Button>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

export default PanelDocente;
