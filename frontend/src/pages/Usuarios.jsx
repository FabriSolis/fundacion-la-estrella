import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import api from "../services/api";

function Usuarios() {
  const navigate = useNavigate();
  const location = useLocation();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const [abiertoConfirmacion, setAbiertoConfirmacion] = useState(false);

  const [procesando, setProcesando] = useState(false);

  async function cargarUsuarios() {
    try {
      setError("");

      const respuesta = await api.get("/usuarios");

      setUsuarios(respuesta.data);
    } catch (error) {
      setError(
        error.response?.data?.mensaje || "No se pudieron cargar los usuarios",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarUsuarios();
  }, []);

  function colorEstado(estado) {
    if (estado === "activo") return "success";
    if (estado === "bloqueado") return "error";
    if (estado === "inactivo") return "default";

    return "default";
  }

  function abrirConfirmacion(usuario) {
    setUsuarioSeleccionado(usuario);
    setAbiertoConfirmacion(true);
  }

  function cerrarConfirmacion() {
    if (procesando) return;

    setAbiertoConfirmacion(false);
    setUsuarioSeleccionado(null);
  }

  async function cambiarEstado() {
    if (!usuarioSeleccionado) return;

    try {
      setProcesando(true);
      setError("");
      setMensaje("");

      const nuevoEstado =
        usuarioSeleccionado.estado === "activo" ? "inactivo" : "activo";

      await api.patch(`/usuarios/${usuarioSeleccionado.id_usuario}/estado`, {
        estado: nuevoEstado,
      });

      setMensaje(
        nuevoEstado === "activo"
          ? "Usuario activado correctamente"
          : "Usuario desactivado correctamente",
      );

      setAbiertoConfirmacion(false);
      setUsuarioSeleccionado(null);

      await cargarUsuarios();
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No se pudo cambiar el estado del usuario",
      );
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Gestión de usuarios
          </Typography>

          <Typography color="text.secondary">
            Administración de usuarios, roles y estados de acceso.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
          }}
        >
          <Button variant="outlined" onClick={() => navigate("/dashboard")}>
            Volver
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate("/usuarios/nuevo")}
          >
            Nuevo usuario
          </Button>
        </Box>
      </Box>

      {location.state?.mensaje && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {location.state.mensaje}
        </Alert>
      )}

      {mensaje && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {mensaje}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {cargando ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 8,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>

                <TableCell>Nombre y apellido</TableCell>

                <TableCell>DNI</TableCell>

                <TableCell>Email</TableCell>

                <TableCell>Teléfono</TableCell>

                <TableCell>Rol</TableCell>

                <TableCell>Estado</TableCell>

                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {usuarios.map((usuario) => {
                const estaActivo = usuario.estado === "activo";

                return (
                  <TableRow key={usuario.id_usuario} hover>
                    <TableCell>{usuario.id_usuario}</TableCell>

                    <TableCell>
                      {usuario.nombre} {usuario.apellido}
                    </TableCell>

                    <TableCell>{usuario.dni}</TableCell>

                    <TableCell>{usuario.email}</TableCell>

                    <TableCell>{usuario.telefono || "-"}</TableCell>

                    <TableCell>{usuario.rol}</TableCell>

                    <TableCell>
                      <Chip
                        label={usuario.estado}
                        color={colorEstado(usuario.estado)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Button
                        size="small"
                        color={estaActivo ? "error" : "success"}
                        onClick={() => abrirConfirmacion(usuario)}
                      >
                        {estaActivo ? "Desactivar" : "Activar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {usuarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={abiertoConfirmacion} onClose={cerrarConfirmacion}>
        <DialogTitle>
          {usuarioSeleccionado?.estado === "activo"
            ? "Desactivar usuario"
            : "Activar usuario"}
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            {usuarioSeleccionado?.estado === "activo"
              ? `¿Querés desactivar a ${usuarioSeleccionado?.nombre} ${usuarioSeleccionado?.apellido}?`
              : `¿Querés activar a ${usuarioSeleccionado?.nombre} ${usuarioSeleccionado?.apellido}?`}
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={cerrarConfirmacion} disabled={procesando}>
            Cancelar
          </Button>

          <Button
            onClick={cambiarEstado}
            color={
              usuarioSeleccionado?.estado === "activo" ? "error" : "success"
            }
            variant="contained"
            disabled={procesando}
          >
            {procesando
              ? "Procesando..."
              : usuarioSeleccionado?.estado === "activo"
                ? "Desactivar"
                : "Activar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Usuarios;
