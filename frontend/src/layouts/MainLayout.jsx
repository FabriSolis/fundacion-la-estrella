import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaymentsIcon from "@mui/icons-material/Payments";
import BarChartIcon from "@mui/icons-material/BarChart";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";

const drawerWidth = 250;

const opciones = [
  { texto: "Dashboard", icono: <DashboardIcon />, ruta: "/dashboard" },
  { texto: "Usuarios", icono: <PeopleIcon />, ruta: "/usuarios" },
  { texto: "Pacientes", icono: <FavoriteIcon />, ruta: "/pacientes" },
  {
    texto: "Terapeutas",
    icono: <MedicalServicesIcon />,
    ruta: "/terapeutas",
  },
  { texto: "Alumnos", icono: <SchoolIcon />, ruta: "/alumnos" },
  { texto: "Cursos", icono: <MenuBookIcon />, ruta: "/cursos" },
  { texto: "Turnos", icono: <CalendarMonthIcon />, ruta: "/turnos" },
  { texto: "Pagos", icono: <PaymentsIcon />, ruta: "/pagos" },
  { texto: "Reportes", icono: <BarChartIcon />, ruta: "/reportes" },
];

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuAbierto, setMenuAbierto] = useState(false);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/");
  };

  const contenidoMenu = (
    <Box>
      <Toolbar sx={{ px: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Fundación La Estrella
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Sistema Integral de Gestión
          </Typography>
        </Box>
      </Toolbar>

      <Divider />

      <List sx={{ px: 1 }}>
        {opciones.map((opcion) => (
          <ListItemButton
            key={opcion.texto}
            selected={location.pathname === opcion.ruta}
            onClick={() => {
              navigate(opcion.ruta);
              setMenuAbierto(false);
            }}
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon>{opcion.icono}</ListItemIcon>
            <ListItemText primary={opcion.texto} />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      <List sx={{ px: 1 }}>
        <ListItemButton
          onClick={cerrarSesion}
          sx={{
            borderRadius: 2,
            color: "error.main",
          }}
        >
          <ListItemIcon>
            <LogoutIcon color="error" />
          </ListItemIcon>

          <ListItemText primary="Cerrar sesión" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          ml: { md: `${drawerWidth}px` },
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMenuAbierto(true)}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Panel administrativo
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2" fontWeight="bold">
                {usuario.nombre} {usuario.apellido}
              </Typography>

              <Typography variant="caption">{usuario.rol}</Typography>
            </Box>

            <Avatar>{usuario.nombre?.charAt(0) || "U"}</Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={menuAbierto}
        onClose={() => setMenuAbierto(false)}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
          },
        }}
      >
        {contenidoMenu}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        {contenidoMenu}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f5f6fa",
          minHeight: "100vh",
          p: 3,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default MainLayout;
