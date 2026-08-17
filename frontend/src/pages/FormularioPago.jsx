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

function FormularioPago() {
  const navigate = useNavigate();
  const { id } = useParams();

  const esEdicion = Boolean(id);

  const [inscripciones, setInscripciones] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [tipoPago, setTipoPago] = useState("educativo");

  const [formulario, setFormulario] = useState({
    idInscripcion: "",
    idTurno: "",
    concepto: "",
    monto: "",
    fechaPago: new Date().toISOString().slice(0, 16),
    medioPago: "transferencia",
    estado: "registrado",
    comprobanteUrl: "",
    observacion: "",
  });

  useEffect(() => {
    async function cargarDatos() {
      try {
        setError("");

        const respuestaOpciones = await api.get("/pagos/opciones");

        setInscripciones(respuestaOpciones.data.inscripciones);
        setTurnos(respuestaOpciones.data.turnos);

        if (esEdicion) {
          const respuestaPago = await api.get(`/pagos/${id}`);
          const pago = respuestaPago.data;

          setTipoPago(pago.id_inscripcion ? "educativo" : "terapeutico");

          setFormulario({
            idInscripcion: pago.id_inscripcion || "",
            idTurno: pago.id_turno || "",
            concepto: pago.concepto || "",
            monto: pago.monto || "",
            fechaPago: pago.fecha_pago
              ? String(pago.fecha_pago).substring(0, 16)
              : "",
            medioPago: pago.medio_pago || "transferencia",
            estado: pago.estado || "registrado",
            comprobanteUrl: pago.comprobante_url || "",
            observacion: pago.observacion || "",
          });
        }
      } catch (error) {
        setError(
          error.response?.data?.mensaje || "No se pudieron cargar los datos",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [esEdicion, id]);

  function manejarCambio(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function cambiarTipoPago(evento) {
    const tipo = evento.target.value;

    setTipoPago(tipo);

    setFormulario((anterior) => ({
      ...anterior,
      idInscripcion: "",
      idTurno: "",
    }));
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError("");

    if (
      !formulario.concepto.trim() ||
      !formulario.monto ||
      !formulario.medioPago ||
      !formulario.estado
    ) {
      setError("Completá todos los campos obligatorios");
      return;
    }

    if (!esEdicion && tipoPago === "educativo" && !formulario.idInscripcion) {
      setError("Seleccioná una inscripción");
      return;
    }

    if (!esEdicion && tipoPago === "terapeutico" && !formulario.idTurno) {
      setError("Seleccioná un turno");
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        concepto: formulario.concepto,
        monto: Number(formulario.monto),
        fechaPago: formulario.fechaPago,
        medioPago: formulario.medioPago,
        estado: formulario.estado,
        comprobanteUrl: formulario.comprobanteUrl || null,
        observacion: formulario.observacion || null,
      };

      if (esEdicion) {
        await api.put(`/pagos/${id}`, datos);
      } else {
        datos.idInscripcion =
          tipoPago === "educativo" ? Number(formulario.idInscripcion) : null;

        datos.idTurno =
          tipoPago === "terapeutico" ? Number(formulario.idTurno) : null;

        await api.post("/pagos", datos);
      }

      navigate("/pagos", {
        state: {
          mensaje: esEdicion
            ? "Pago actualizado correctamente"
            : "Pago registrado correctamente",
        },
      });
    } catch (error) {
      setError(error.response?.data?.mensaje || "No se pudo guardar el pago");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 900 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {esEdicion ? "Editar pago" : "Nuevo pago"}
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Registrá pagos educativos o terapéuticos.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={manejarEnvio}>
        <Stack spacing={3}>
          {!esEdicion && (
            <FormControl fullWidth required>
              <InputLabel>Tipo de pago</InputLabel>

              <Select
                label="Tipo de pago"
                value={tipoPago}
                onChange={cambiarTipoPago}
              >
                <MenuItem value="educativo">Educativo</MenuItem>

                <MenuItem value="terapeutico">Terapéutico</MenuItem>
              </Select>
            </FormControl>
          )}

          {!esEdicion && tipoPago === "educativo" && (
            <FormControl fullWidth required>
              <InputLabel>Inscripción</InputLabel>

              <Select
                name="idInscripcion"
                label="Inscripción"
                value={formulario.idInscripcion}
                onChange={manejarCambio}
              >
                {inscripciones.map((inscripcion) => (
                  <MenuItem
                    key={inscripcion.id_inscripcion}
                    value={inscripcion.id_inscripcion}
                  >
                    {inscripcion.apellido}, {inscripcion.nombre} —{" "}
                    {inscripcion.curso_nombre} — {inscripcion.curso_nivel}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {!esEdicion && tipoPago === "terapeutico" && (
            <FormControl fullWidth required>
              <InputLabel>Turno</InputLabel>

              <Select
                name="idTurno"
                label="Turno"
                value={formulario.idTurno}
                onChange={manejarCambio}
              >
                {turnos.map((turno) => (
                  <MenuItem key={turno.id_turno} value={turno.id_turno}>
                    {turno.apellido}, {turno.nombre} —{" "}
                    {String(turno.fecha).substring(0, 10)} — {turno.hora}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            required
            label="Concepto"
            name="concepto"
            value={formulario.concepto}
            onChange={manejarCambio}
            placeholder="Ej: Cuota mensual"
          />

          <TextField
            fullWidth
            required
            type="number"
            label="Monto"
            name="monto"
            value={formulario.monto}
            onChange={manejarCambio}
          />

          <TextField
            fullWidth
            required
            type="datetime-local"
            label="Fecha y hora del pago"
            name="fechaPago"
            value={formulario.fechaPago}
            onChange={manejarCambio}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth required>
              <InputLabel>Medio de pago</InputLabel>

              <Select
                name="medioPago"
                label="Medio de pago"
                value={formulario.medioPago}
                onChange={manejarCambio}
              >
                <MenuItem value="efectivo">Efectivo</MenuItem>

                <MenuItem value="transferencia">Transferencia</MenuItem>

                <MenuItem value="otro">Otro</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Estado</InputLabel>

              <Select
                name="estado"
                label="Estado"
                value={formulario.estado}
                onChange={manejarCambio}
              >
                <MenuItem value="registrado">Registrado</MenuItem>

                <MenuItem value="pendiente">Pendiente</MenuItem>

                <MenuItem value="anulado">Anulado</MenuItem>

                <MenuItem value="reintegrado">Reintegrado</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <TextField
            fullWidth
            label="URL del comprobante"
            name="comprobanteUrl"
            value={formulario.comprobanteUrl}
            onChange={manejarCambio}
            placeholder="https://..."
          />

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Observación"
            name="observacion"
            value={formulario.observacion}
            onChange={manejarCambio}
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate("/pagos")}
              disabled={guardando}
            >
              Cancelar
            </Button>

            <Button type="submit" variant="contained" disabled={guardando}>
              {guardando ? (
                <CircularProgress size={24} color="inherit" />
              ) : esEdicion ? (
                "Guardar cambios"
              ) : (
                "Registrar pago"
              )}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

export default FormularioPago;
