import { useState } from "react";
import { useNavigate } from "react-router-dom";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

function obtenerFecha(fecha) {
  if (!fecha) return "";

  return String(fecha).substring(0, 10);
}

function normalizarHora(hora) {
  if (!hora) return "";

  return hora.length === 5 ? `${hora}:00` : hora.substring(0, 8);
}

function sumarUnaHora(fecha, hora) {
  const partes = hora.split(":");

  let horas = Number(partes[0]);
  const minutos = Number(partes[1]);

  horas += 1;

  const horaFinal = String(horas).padStart(2, "0");
  const minutoFinal = String(minutos).padStart(2, "0");

  return `${fecha}T${horaFinal}:${minutoFinal}:00`;
}

function colorPorEstado(estado) {
  switch (estado) {
    case "confirmado":
      return "#2e7d32";

    case "cancelado":
      return "#c62828";

    case "realizado":
      return "#1565c0";

    case "reprogramado":
      return "#ef6c00";

    case "ausente":
      return "#616161";

    default:
      return "#f9a825";
  }
}

function AgendaTurnos({ turnos = [] }) {
  const navigate = useNavigate();

  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);

  const eventos = turnos
    .filter((turno) => turno.fecha && turno.hora)
    .map((turno) => {
      const fecha = obtenerFecha(turno.fecha);
      const hora = normalizarHora(turno.hora);

      return {
        id: String(turno.id_turno),

        title: `${turno.paciente_nombre} ${turno.paciente_apellido}`,

        start: `${fecha}T${hora}`,

        end: sumarUnaHora(fecha, hora),

        backgroundColor: colorPorEstado(turno.estado),
        borderColor: colorPorEstado(turno.estado),
        textColor: "#ffffff",

        extendedProps: {
          terapeuta: `${turno.terapeuta_nombre} ${turno.terapeuta_apellido}`,
          estado: turno.estado,
          modalidad: turno.modalidad,
          motivoConsulta: turno.motivo_consulta,
          observacion: turno.observacion,
        },
      };
    });

  const cerrarModal = () => {
    setTurnoSeleccionado(null);
  };

  return (
    <>
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={esLocale}
        events={eventos}
        allDaySlot={false}
        height="auto"
        slotMinTime="08:00:00"
        slotMaxTime="21:00:00"
        slotDuration="00:30:00"
        nowIndicator
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        }}
        eventClick={(info) => {
          setTurnoSeleccionado({
            id: info.event.id,
            paciente: info.event.title,
            terapeuta: info.event.extendedProps.terapeuta,
            estado: info.event.extendedProps.estado,
            modalidad: info.event.extendedProps.modalidad,
            motivoConsulta: info.event.extendedProps.motivoConsulta || "-",
            observacion: info.event.extendedProps.observacion || "-",
            inicio: info.event.start,
          });
        }}
      />

      <Dialog
        open={Boolean(turnoSeleccionado)}
        onClose={cerrarModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Detalle del turno</DialogTitle>

        <DialogContent>
          {turnoSeleccionado && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography>
                <strong>Paciente:</strong> {turnoSeleccionado.paciente}
              </Typography>

              <Typography>
                <strong>Terapeuta:</strong> {turnoSeleccionado.terapeuta}
              </Typography>

              <Typography>
                <strong>Fecha y hora:</strong>{" "}
                {turnoSeleccionado.inicio?.toLocaleString("es-AR")}
              </Typography>

              <Typography>
                <strong>Modalidad:</strong> {turnoSeleccionado.modalidad}
              </Typography>

              <Typography>
                <strong>Estado:</strong> {turnoSeleccionado.estado}
              </Typography>

              <Typography>
                <strong>Motivo de consulta:</strong>{" "}
                {turnoSeleccionado.motivoConsulta}
              </Typography>

              <Typography>
                <strong>Observación:</strong> {turnoSeleccionado.observacion}
              </Typography>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={cerrarModal}>Cerrar</Button>
          <Button
            variant="contained"
            color="success"
            disabled={turnoSeleccionado?.estado === "realizado"}
            onClick={() => navigate(`/sesiones/nueva/${turnoSeleccionado.id}`)}
          >
            Registrar sesión
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              navigate(`/turnos/${turnoSeleccionado.id}/editar`);
            }}
          >
            Editar turno
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AgendaTurnos;
