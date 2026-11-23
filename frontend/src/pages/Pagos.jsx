import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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

  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);

  const [comprobante, setComprobante] = useState(null);

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

  function formatearMonto(monto) {
    return (
      "$ " +
      Number(monto).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
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
      return `${pago.alumno_nombre || ""} ${pago.alumno_apellido || ""}`.trim();
    }

    return `${pago.paciente_nombre || ""} ${pago.paciente_apellido || ""}`.trim();
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
      setError("");

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

  // CU-14: Consultar estado de cuenta

  function abrirEstadoCuenta(pago) {
    const esAlumno = Boolean(pago.id_inscripcion);

    const id = esAlumno ? pago.id_alumno : pago.id_paciente;

    if (!id) {
      setError(
        "No se encontró el identificador de la persona. Verificá el backend.",
      );
      return;
    }

    setError("");

    setPersonaSeleccionada({
      id: id,
      tipo: esAlumno ? "Alumno" : "Paciente",
      nombre: obtenerPersona(pago),
    });
  }

  const pagosPersona = personaSeleccionada
    ? pagos.filter((pago) =>
        personaSeleccionada.tipo === "Alumno"
          ? pago.id_alumno === personaSeleccionada.id
          : pago.id_paciente === personaSeleccionada.id,
      )
    : [];

  function totalPorEstado(estado) {
    return pagosPersona
      .filter((pago) => pago.estado === estado)
      .reduce((total, pago) => total + Number(pago.monto), 0);
  }

  // CU-15: Generar comprobante de pago

  function numeroComprobante(pago) {
    return String(pago.id_pago).padStart(6, "0");
  }

  function descargarComprobante(pago) {
    if (!pago || pago.estado !== "registrado") return;

    const pdf = new jsPDF();

    const ancho = pdf.internal.pageSize.getWidth();
    const margen = 20;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);

    pdf.text("Fundación La Estrella", ancho / 2, 24, {
      align: "center",
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    pdf.text("Fundación Holística de Ayuda al Prójimo", ancho / 2, 32, {
      align: "center",
    });

    pdf.text("Molinari - Córdoba", ancho / 2, 39, {
      align: "center",
    });

    pdf.line(margen, 46, ancho - margen, 46);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);

    pdf.text("COMPROBANTE DE PAGO", ancho / 2, 58, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);

    pdf.text(`Nro. ${numeroComprobante(pago)}`, ancho / 2, 67, {
      align: "center",
    });

    let y = 83;

    const datos = [
      ["Persona", obtenerPersona(pago)],
      ["Tipo", pago.id_inscripcion ? "Alumno" : "Paciente"],
      ["Fecha del pago", formatearFecha(pago.fecha_pago)],
      ["Origen", obtenerOrigen(pago)],
      ["Concepto", pago.concepto],
      ["Medio de pago", pago.medio_pago],
      ["Estado", pago.estado],
    ];

    datos.forEach(([titulo, valor]) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(`${titulo}:`, margen, y);

      pdf.setFont("helvetica", "normal");

      const lineas = pdf.splitTextToSize(String(valor || "-"), ancho - 85);

      pdf.text(lineas, 65, y);

      y += Math.max(11, lineas.length * 6 + 5);
    });

    pdf.line(margen, y, ancho - margen, y);

    y += 12;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);

    pdf.text("Total abonado:", margen, y);

    pdf.text(formatearMonto(pago.monto), ancho - margen, y, { align: "right" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    pdf.text(
      "Comprobante interno de pago. No válido como factura fiscal.",
      ancho / 2,
      y + 18,
      { align: "center" },
    );

    pdf.save(`Comprobante-${numeroComprobante(pago)}.pdf`);
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

                <TableCell>{formatearMonto(pago.monto)}</TableCell>

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

                  <Button size="small" onClick={() => abrirEstadoCuenta(pago)}>
                    Estado de cuenta
                  </Button>

                  {pago.estado === "registrado" && (
                    <Button
                      size="small"
                      color="success"
                      onClick={() => setComprobante(pago)}
                    >
                      Comprobante
                    </Button>
                  )}

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

      {/* CU-14: Ventana de estado de cuenta */}

      <Dialog
        open={Boolean(personaSeleccionada)}
        onClose={() => setPersonaSeleccionada(null)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Estado de cuenta</DialogTitle>

        <DialogContent dividers>
          <Typography variant="h6" fontWeight="bold">
            {personaSeleccionada?.nombre}
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {personaSeleccionada?.tipo} - Historial de pagos
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr 1fr",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
              mb: 3,
            }}
          >
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography color="text.secondary">Total registrado</Typography>

              <Typography variant="h6" color="success.main" fontWeight="bold">
                {formatearMonto(totalPorEstado("registrado"))}
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography color="text.secondary">Total pendiente</Typography>

              <Typography variant="h6" color="warning.main" fontWeight="bold">
                {formatearMonto(totalPorEstado("pendiente"))}
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography color="text.secondary">Total anulado</Typography>

              <Typography variant="h6" color="error.main" fontWeight="bold">
                {formatearMonto(totalPorEstado("anulado"))}
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography color="text.secondary">Total reintegrado</Typography>

              <Typography variant="h6" color="info.main" fontWeight="bold">
                {formatearMonto(totalPorEstado("reintegrado"))}
              </Typography>
            </Paper>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Origen</TableCell>
                  <TableCell>Concepto</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Medio</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {pagosPersona.map((pago) => (
                  <TableRow key={pago.id_pago}>
                    <TableCell>{formatearFecha(pago.fecha_pago)}</TableCell>

                    <TableCell>{obtenerOrigen(pago)}</TableCell>

                    <TableCell>{pago.concepto}</TableCell>

                    <TableCell>{formatearMonto(pago.monto)}</TableCell>

                    <TableCell>{pago.medio_pago}</TableCell>

                    <TableCell>
                      <Chip
                        label={pago.estado}
                        color={colorEstado(pago.estado)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}

                {pagosPersona.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay movimientos registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setPersonaSeleccionada(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* CU-15: Vista previa del comprobante */}

      <Dialog
        open={Boolean(comprobante)}
        onClose={() => setComprobante(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Comprobante de pago</DialogTitle>

        <DialogContent dividers>
          {comprobante && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Box
                sx={{
                  textAlign: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h5" fontWeight="bold">
                  Fundación La Estrella
                </Typography>

                <Typography variant="body2">
                  Fundación Holística de Ayuda al Prójimo
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Molinari - Córdoba
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="h6" align="center" fontWeight="bold">
                COMPROBANTE DE PAGO
              </Typography>

              <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
                Nro. {numeroComprobante(comprobante)}
              </Typography>

              <Stack spacing={1}>
                <Typography>
                  <strong>Persona:</strong> {obtenerPersona(comprobante)}
                </Typography>

                <Typography>
                  <strong>Tipo:</strong>{" "}
                  {comprobante.id_inscripcion ? "Alumno" : "Paciente"}
                </Typography>

                <Typography>
                  <strong>Fecha:</strong>{" "}
                  {formatearFecha(comprobante.fecha_pago)}
                </Typography>

                <Typography>
                  <strong>Origen:</strong> {obtenerOrigen(comprobante)}
                </Typography>

                <Typography>
                  <strong>Concepto:</strong> {comprobante.concepto}
                </Typography>

                <Typography>
                  <strong>Medio de pago:</strong> {comprobante.medio_pago}
                </Typography>

                <Typography>
                  <strong>Estado:</strong> {comprobante.estado}
                </Typography>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography fontWeight="bold">Total abonado</Typography>

                <Typography variant="h5" color="success.main" fontWeight="bold">
                  {formatearMonto(comprobante.monto)}
                </Typography>
              </Stack>

              <Typography
                variant="caption"
                display="block"
                align="center"
                color="text.secondary"
                sx={{ mt: 3 }}
              >
                Comprobante interno de pago. No válido como factura fiscal.
              </Typography>
            </Paper>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setComprobante(null)}>Cerrar</Button>

          <Button
            variant="contained"
            color="success"
            onClick={() => descargarComprobante(comprobante)}
          >
            Descargar PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Pagos;
