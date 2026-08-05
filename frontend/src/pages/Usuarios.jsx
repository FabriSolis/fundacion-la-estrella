import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from "@mui/material";
import api from "../services/api";

function Usuarios() {
  const navigate = useNavigate();
  const location = useLocation();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarUsuarios() {
      try {
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

    cargarUsuarios();
  }, []);

  const colorEstado = (estado) => {
    if (estado === "activo") return "success";
    if (estado === "bloqueado") return "error";
    return "default";
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Gestión de usuarios
          </Typography>

          <Typography color="text.secondary">
            Administración de usuarios, roles y estados.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
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
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {cargando ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
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
              {usuarios.map((usuario) => (
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
                    <Button size="small">Editar</Button>

                    <Button size="small" color="error">
                      Desactivar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

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
    </Box>
  );
}

export default Usuarios;
