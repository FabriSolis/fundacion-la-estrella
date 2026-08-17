import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import api from "../services/api";

function Pagos() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pagos, setPagos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarPagos() {
      try {
        setError("");

        const respuesta = await api.get("/pagos");
        setPagos(respuesta.data);
      } catch (error) {
        setError(
          error.response?.data?.mensaje || "No se pudieron cargar los pagos",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarPagos();
  }, []);

  const pagosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return pagos;

    return pagos.filter((pago) => {
      const alumno =
        `${pago.alumno_nombre || ""} ${pago.alumno_apellido || ""}`.toLowerCase();

      const paciente =
        `${pago.paciente_nombre || ""} ${pago.paciente_apellido || ""}`.toLowerCase();

      return (
        pago.concepto?.toLowerCase().includes(texto) ||
        pago.medio_pago?.toLowerCase().includes(texto) ||
        pago.estado?.toLowerCase().includes(texto) ||
        pago.curso_nombre?.toLowerCase().includes(texto) ||
        alumno.includes(texto) ||
        paciente.includes(texto)
      );
    });
  }, [pagos, busqueda]);

  function formatearFecha(fecha) {
    if (!fecha) return "-";

    return new Date(fecha).toLocaleString("es-AR");
  }

  function colorEstado(estado) {
    switch (estado) {
      case "registrado":
        return "success";

      case "pendiente":
        return "warning";

      case "anulado":
        return "error";

      case "reintegrado":
        return "info";

      default:
        return "default";
    }
  }

  function obtenerPersona(pago) {
    if (pago.id_inscripcion) {
      return `${pago.alumno_nombre || ""} ${pago.alumno_apellido || ""}`;
    }

    return `${pago.paciente_nombre || ""} ${pago.paciente_apellido || ""}`;
  }

  function obtenerOrigen(pago) {
    if (pago.id_inscripcion) {
      return pago.curso_nombre || "Inscripción";
    }

    return pago.turno_fecha
      ? `Turno ${String(pago.turno_fecha).substring(0, 10)} ${pago.turno_hora || ""}`
      : "Turno terapéutico";
  }

  async function cambiarEstado(pago, nuevoEstado) {
    const confirmar = window.confirm(
      `¿Deseás cambiar el estado del pago a ${nuevoEstado}?`,
    );

    if (!confirmar) return;

    try {
      await api.patch(`/pagos/${pago.id_pago}/estado`, {
        estado: nuevoEstado,
      });

      setPagos((anteriores) =>
        anteriores.map((item) =>
          item.id_pago === pago.id_pago
            ? { ...item, estado: nuevoEstado }
            : item,
        ),
      );
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No se pudo cambiar el estado del pago",
      );
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
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Gestión de pagos
          </Typography>

          <Typography color="text.secondary">
            Registro y control de pagos educativos y terapéuticos.
          </Typography>
        </Box>

        <Button variant="contained" onClick={() => navigate("/pagos/nuevo")}>
          Nuevo pago
        </Button>
      </Stack>

      <TextField
        fullWidth
        label="Buscar por persona, concepto, curso, medio o estado"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
        sx={{ mb: 3 }}
      />

      {location.state?.mensaje && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {location.state.mensaje}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Persona</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Concepto</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Medio</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {pagosFiltrados.map((pago) => (
              <TableRow key={pago.id_pago} hover>
                <TableCell>{formatearFecha(pago.fecha_pago)}</TableCell>

                <TableCell>{obtenerPersona(pago)}</TableCell>

                <TableCell>{obtenerOrigen(pago)}</TableCell>

                <TableCell>{pago.concepto}</TableCell>

                <TableCell>
                  ${Number(pago.monto).toLocaleString("es-AR")}
                </TableCell>

                <TableCell>{pago.medio_pago}</TableCell>

                <TableCell>
                  <Chip
                    label={pago.estado}
                    color={colorEstado(pago.estado)}
                    size="small"
                  />
                </TableCell>

                <TableCell align="center">
                  <Button
                    size="small"
                    onClick={() => navigate(`/pagos/${pago.id_pago}/editar`)}
                  >
                    Editar
                  </Button>

                  {pago.estado === "pendiente" && (
                    <Button
                      size="small"
                      color="success"
                      onClick={() => cambiarEstado(pago, "registrado")}
                    >
                      Registrar
                    </Button>
                  )}

                  {pago.estado !== "anulado" && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => cambiarEstado(pago, "anulado")}
                    >
                      Anular
                    </Button>
                  )}

                  {pago.estado === "registrado" && (
                    <Button
                      size="small"
                      color="info"
                      onClick={() => cambiarEstado(pago, "reintegrado")}
                    >
                      Reintegrar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {pagosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No se encontraron pagos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Pagos;
