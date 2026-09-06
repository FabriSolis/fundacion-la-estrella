import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import api from "../services/api";

function FormularioSesion() {
  const navigate = useNavigate();
  const { idTurno } = useParams();

  const [turno, setTurno] = useState(null);
  const [idSesion, setIdSesion] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState({
    evolucion: "",
    observaciones: "",
    recomendaciones: "",
  });

  useEffect(() => {
    async function cargarDatos() {
      try {
        setError("");

        const respuestaTurno = await api.get(`/turnos/${idTurno}`);
        setTurno(respuestaTurno.data);

        try {
          const respuestaSesion = await api.get(`/sesiones/turno/${idTurno}`);

          const sesion = respuestaSesion.data;

          setIdSesion(sesion.id_sesion);

          setFormulario({
            evolucion: sesion.evolucion || "",
            observaciones: sesion.observaciones || "",
            recomendaciones: sesion.recomendaciones || "",
          });
        } catch (errorSesion) {
          if (errorSesion.response?.status !== 404) {
            throw errorSesion;
          }
        }
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No se pudieron cargar los datos de la sesión",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [idTurno]);

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

    if (
      !formulario.evolucion.trim() &&
      !formulario.observaciones.trim() &&
      !formulario.recomendaciones.trim()
    ) {
      setError("Completá al menos uno de los campos de la sesión");
      return;
    }

    try {
      setGuardando(true);

      if (idSesion) {
        await api.put(`/sesiones/${idSesion}`, {
          evolucion: formulario.evolucion,
          observaciones: formulario.observaciones,
          recomendaciones: formulario.recomendaciones,
        });

        navigate("/turnos", {
          state: {
            mensaje: "Sesión actualizada correctamente",
          },
        });
      } else {
        await api.post("/sesiones", {
          idTurno: Number(idTurno),
          evolucion: formulario.evolucion,
          observaciones: formulario.observaciones,
          recomendaciones: formulario.recomendaciones,
        });

        navigate("/turnos", {
          state: {
            mensaje:
              "Sesión registrada correctamente y turno marcado como realizado",
          },
        });
      }
    } catch (error) {
      setError(error.response?.data?.mensaje || "No se pudo guardar la sesión");
    } finally {
      setGuardando(false);
    }
  };

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
    <Paper
      sx={{
        p: 4,
        borderRadius: 3,
        maxWidth: 900,
      }}
    >
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {idSesion
          ? "Ver / editar sesión terapéutica"
          : "Registrar sesión terapéutica"}
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {idSesion
          ? "Consultá o modificá la información registrada en la sesión."
          : "Registrá la evolución, las observaciones y las recomendaciones correspondientes a la sesión."}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {turno && (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
          }}
        >
          <Stack spacing={1}>
            <Typography>
              <strong>Paciente:</strong> {turno.paciente_nombre}{" "}
              {turno.paciente_apellido}
            </Typography>

            <Typography>
              <strong>Terapeuta:</strong> {turno.terapeuta_nombre}{" "}
              {turno.terapeuta_apellido}
            </Typography>

            <Typography>
              <strong>Fecha:</strong>{" "}
              {turno.fecha
                ? String(turno.fecha)
                    .substring(0, 10)
                    .split("-")
                    .reverse()
                    .join("/")
                : "-"}
            </Typography>

            <Typography>
              <strong>Hora:</strong> {turno.hora}
            </Typography>

            <Typography>
              <strong>Modalidad:</strong> {turno.modalidad}
            </Typography>

            <Typography>
              <strong>Estado:</strong> {turno.estado}
            </Typography>
          </Stack>
        </Paper>
      )}

      <Box component="form" onSubmit={manejarEnvio}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Evolución del paciente"
            name="evolucion"
            value={formulario.evolucion}
            onChange={manejarCambio}
          />

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Observaciones de la sesión"
            name="observaciones"
            value={formulario.observaciones}
            onChange={manejarCambio}
          />

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Recomendaciones"
            name="recomendaciones"
            value={formulario.recomendaciones}
            onChange={manejarCambio}
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate("/turnos")}
              disabled={guardando}
            >
              Volver
            </Button>

            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={guardando}
            >
              {guardando ? (
                <CircularProgress size={24} color="inherit" />
              ) : idSesion ? (
                "Actualizar sesión"
              ) : (
                "Guardar sesión"
              )}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

export default FormularioSesion;
