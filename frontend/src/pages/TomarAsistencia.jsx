import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import api from "../services/api";

import { ROLES, obtenerRol } from "../config/permisos";

// ==========================================
// FORMATEAR FECHAS
// ==========================================

function formatearFecha(fecha) {
  if (!fecha) return "-";

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
// TOMAR ASISTENCIA
// ==========================================

function TomarAsistencia() {
  const navigate = useNavigate();
  const { idClase } = useParams();

  const rol = obtenerRol();

  const esDocente = rol === ROLES.DOCENTE;

  // Destino según el rol.
  const rutaVolver = esDocente ? "/mi-panel" : "/clases";

  const textoVolver = esDocente ? "Volver a mi panel" : "Volver a clases";

  const [clase, setClase] = useState(null);
  const [alumnos, setAlumnos] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // ========================================
  // CARGAR ASISTENCIA DE LA CLASE
  // ========================================

  useEffect(() => {
    let activo = true;

    async function cargarAsistencia() {
      setCargando(true);
      setError("");
      setMensaje("");
      setClase(null);
      setAlumnos([]);

      try {
        const respuesta = await api.get(`/asistencias/clase/${idClase}`);

        if (!activo) return;

        setClase(respuesta.data.clase);

        const datos = Array.isArray(respuesta.data.alumnos)
          ? respuesta.data.alumnos
          : [];

        setAlumnos(
          datos.map((alumno) => ({
            ...alumno,

            estadoAsistencia: alumno.estado_asistencia || "presente",

            observacion: alumno.observacion || "",
          })),
        );
      } catch (error) {
        if (!activo) return;

        setError(
          error.response?.data?.mensaje || "No se pudo cargar la asistencia",
        );
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarAsistencia();

    return () => {
      activo = false;
    };
  }, [idClase]);

  // ========================================
  // CAMBIAR ESTADO DE ASISTENCIA
  // ========================================

  function cambiarEstado(idAlumno, estado) {
    setMensaje("");

    setAlumnos((anteriores) =>
      anteriores.map((alumno) =>
        alumno.id_alumno === idAlumno
          ? {
              ...alumno,
              estadoAsistencia: estado,
            }
          : alumno,
      ),
    );
  }

  // ========================================
  // CAMBIAR OBSERVACIÓN
  // ========================================

  function cambiarObservacion(idAlumno, observacion) {
    setMensaje("");

    setAlumnos((anteriores) =>
      anteriores.map((alumno) =>
        alumno.id_alumno === idAlumno
          ? {
              ...alumno,
              observacion,
            }
          : alumno,
      ),
    );
  }

  // ========================================
  // GUARDAR ASISTENCIA
  // ========================================

  async function guardarAsistencia() {
    if (!clase || alumnos.length === 0 || guardando) {
      return;
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const asistencias = alumnos.map((alumno) => ({
        idAlumno: alumno.id_alumno,
        estadoAsistencia: alumno.estadoAsistencia,
        observacion: alumno.observacion,
      }));

      await api.put(`/asistencias/clase/${idClase}`, { asistencias });

      setMensaje("Asistencia guardada correctamente");
    } catch (error) {
      setError(
        error.response?.data?.mensaje || "No se pudo guardar la asistencia",
      );
    } finally {
      setGuardando(false);
    }
  }

  // ========================================
  // VOLVER SEGÚN EL ROL
  // ========================================

  function volver() {
    navigate(rutaVolver);
  }

  // ========================================
  // PANTALLA DE CARGA
  // ========================================

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

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", pb: 4 }}>
      {/* ENCABEZADO */}

      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{
          xs: "stretch",
          md: "center",
        }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Tomar asistencia
          </Typography>

          {clase && (
            <>
              <Typography color="text.secondary">
                {clase.curso_nombre} —{" "}
                {clase.curso_nivel || "Nivel sin especificar"}
              </Typography>

              <Typography color="text.secondary">
                {formatearFecha(clase.fecha)} — {clase.hora_inicio} a{" "}
                {clase.hora_fin}
              </Typography>

              {clase.tema && (
                <Typography color="text.secondary">
                  Tema: {clase.tema}
                </Typography>
              )}
            </>
          )}
        </Box>

        <Button variant="outlined" onClick={volver} disabled={guardando}>
          {textoVolver}
        </Button>
      </Stack>

      {/* MENSAJES */}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {mensaje && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {mensaje}
        </Alert>
      )}

      {/* NO SE PUDO CARGAR LA CLASE */}

      {!clase && !error && (
        <Alert severity="warning">
          No se encontró información de la clase.
        </Alert>
      )}

      {/* ================================= */}
      {/* LISTADO DE ALUMNOS */}
      {/* ================================= */}

      {clase && alumnos.length === 0 && (
        <Alert severity="warning">
          No hay alumnos inscriptos en este curso.
        </Alert>
      )}

      {clase && alumnos.length > 0 && (
        <>
          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              mb: 3,
            }}
          >
            <Typography fontWeight={600}>
              Alumnos registrados: {alumnos.length}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Seleccioná el estado de asistencia de cada alumno y guardá los
              cambios.
            </Typography>
          </Paper>

          <Stack spacing={2}>
            {alumnos.map((alumno) => (
              <Paper
                key={alumno.id_alumno}
                sx={{
                  p: 3,
                  borderRadius: 3,
                }}
              >
                <Stack
                  direction={{
                    xs: "column",
                    md: "row",
                  }}
                  spacing={2}
                  alignItems={{
                    xs: "stretch",
                    md: "center",
                  }}
                >
                  {/* DATOS DEL ALUMNO */}

                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 200,
                    }}
                  >
                    <Typography fontWeight={700}>
                      {alumno.apellido}, {alumno.nombre}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      DNI {alumno.dni || "Sin registrar"}
                    </Typography>
                  </Box>

                  {/* ESTADO DE ASISTENCIA */}

                  <FormControl
                    sx={{
                      minWidth: 180,
                    }}
                    disabled={guardando}
                  >
                    <InputLabel>Asistencia</InputLabel>

                    <Select
                      label="Asistencia"
                      value={alumno.estadoAsistencia}
                      onChange={(evento) =>
                        cambiarEstado(alumno.id_alumno, evento.target.value)
                      }
                    >
                      <MenuItem value="presente">Presente</MenuItem>

                      <MenuItem value="ausente">Ausente</MenuItem>

                      <MenuItem value="justificado">Justificado</MenuItem>
                    </Select>
                  </FormControl>

                  {/* OBSERVACIÓN */}

                  <TextField
                    label="Observación"
                    value={alumno.observacion}
                    onChange={(evento) =>
                      cambiarObservacion(alumno.id_alumno, evento.target.value)
                    }
                    disabled={guardando}
                    inputProps={{
                      maxLength: 255,
                    }}
                    sx={{
                      flex: 2,
                      minWidth: 250,
                    }}
                  />
                </Stack>
              </Paper>
            ))}

            {/* BOTONES */}

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              justifyContent="flex-end"
              spacing={2}
              sx={{ mt: 2 }}
            >
              <Button variant="outlined" onClick={volver} disabled={guardando}>
                Cancelar
              </Button>

              <Button
                variant="contained"
                onClick={guardarAsistencia}
                disabled={guardando || alumnos.length === 0}
              >
                {guardando ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Guardar asistencia"
                )}
              </Button>
            </Stack>
          </Stack>
        </>
      )}
    </Box>
  );
}

export default TomarAsistencia;
