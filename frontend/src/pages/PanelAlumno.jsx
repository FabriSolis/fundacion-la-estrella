import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";

import api from "../services/api";

// FORMATEAR FECHAS
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

// COLORES DE ESTADOS
function colorEstado(estado) {
  const colores = {
    activo: "success",
    pendiente: "warning",
    confirmada: "success",
    "en curso": "info",
    finalizada: "default",
    cancelada: "error",
    programada: "info",
    dictada: "success",
    suspendida: "warning",
  };

  return colores[estado?.toLowerCase()] || "default";
}

// VALIDAR ENLACES VIRTUALES
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

function PanelAlumno() {
  const [alumno, setAlumno] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [clases, setClases] = useState([]);

  const [cargando, setCargando] = useState(true);

  const [errorPerfil, setErrorPerfil] = useState("");
  const [errorCursos, setErrorCursos] = useState("");
  const [errorClases, setErrorClases] = useState("");

  // CARGAR INFORMACIÓN DEL ALUMNO
  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      try {
        const resultados = await Promise.allSettled([
          api.get("/alumnos/mi-perfil"),
          api.get("/inscripciones/mis-cursos"),
          api.get("/clases/mis-clases"),
        ]);

        if (!activo) return;

        const [perfil, cursosAlumno, clasesAlumno] = resultados;

        // PERFIL
        if (perfil.status === "fulfilled") {
          setAlumno(perfil.value.data);
        } else {
          setErrorPerfil(
            perfil.reason?.response?.data?.mensaje ||
              "No se pudo cargar tu perfil.",
          );
        }

        // CURSOS
        if (cursosAlumno.status === "fulfilled") {
          const datos = cursosAlumno.value.data;

          setCursos(Array.isArray(datos) ? datos : []);
        } else {
          setErrorCursos(
            cursosAlumno.reason?.response?.data?.mensaje ||
              "No se pudieron cargar tus cursos.",
          );
        }

        // CLASES
        if (clasesAlumno.status === "fulfilled") {
          const datos = clasesAlumno.value.data;

          setClases(Array.isArray(datos) ? datos : []);
        } else {
          setErrorClases(
            clasesAlumno.reason?.response?.data?.mensaje ||
              "No se pudieron cargar tus clases.",
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

  // PANTALLA DE CARGA
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
        Mi espacio educativo
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Fundación La Estrella
      </Typography>

      {/* ============================== */}
      {/* MI PERFIL */}
      {/* ============================== */}

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

        {alumno && (
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
                {alumno.nombre} {alumno.apellido}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Correo electrónico
              </Typography>

              <Typography sx={{ overflowWrap: "anywhere" }}>
                {alumno.email}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Fecha de ingreso
              </Typography>

              <Typography>{formatearFecha(alumno.fecha_ingreso)}</Typography>
            </Box>

            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.5 }}
              >
                Estado del alumno
              </Typography>

              <Chip
                label={alumno.estado}
                color={colorEstado(alumno.estado)}
                size="small"
              />
            </Box>
          </Box>
        )}
      </Paper>

      {/* ============================== */}
      {/* MIS CURSOS */}
      {/* ============================== */}

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
            Todavía no tenés cursos registrados. Cuando la administración te
            inscriba, aparecerán en esta sección.
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
              key={curso.id_inscripcion}
              sx={{
                p: 3,
                borderRadius: 3,
                height: "100%",
                boxSizing: "border-box",
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                {curso.curso_nombre}
              </Typography>

              <Chip
                label={curso.estado}
                color={colorEstado(curso.estado)}
                size="small"
                sx={{ mb: 2 }}
              />

              <Typography sx={{ mb: 1 }}>
                <strong>Nivel:</strong> {curso.curso_nivel || "Sin especificar"}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                <strong>Modalidad:</strong>{" "}
                {curso.curso_modalidad || "Sin especificar"}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                <strong>Inicio:</strong> {formatearFecha(curso.fecha_inicio)}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                <strong>Finalización:</strong> {formatearFecha(curso.fecha_fin)}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Inscripción realizada el{" "}
                {formatearFecha(curso.fecha_inscripcion)}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* ============================== */}
      {/* MIS CLASES */}
      {/* ============================== */}

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
                {/* CURSO */}

                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  {clase.curso_nombre}
                </Typography>

                {/* ESTADO */}

                <Chip
                  label={clase.estado}
                  color={colorEstado(clase.estado)}
                  size="small"
                  sx={{ mb: 2 }}
                />

                {/* INFORMACIÓN */}

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

                {/* ENLACE PARA CLASE VIRTUAL */}

                {puedeIngresar && (
                  <Button
                    variant="contained"
                    href={enlace}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ mt: 2 }}
                  >
                    Ingresar a clase virtual
                  </Button>
                )}
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

export default PanelAlumno;
