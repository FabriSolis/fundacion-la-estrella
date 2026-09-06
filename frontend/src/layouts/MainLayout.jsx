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

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaymentsIcon from "@mui/icons-material/Payments";
import BarChartIcon from "@mui/icons-material/BarChart";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import logoEstrella from "../assets/logoestrella.png";
const drawerWidth = 250;

const seccionesMenu = [
  {
    titulo: "GENERAL",
    color: "#2563eb",
    opciones: [
      {
        texto: "Dashboard",
        icono: <DashboardIcon />,
        ruta: "/dashboard",
      },
    ],
  },
  {
    titulo: "ÁREA TERAPÉUTICA",
    color: "#7c3aed",
    opciones: [
      {
        texto: "Pacientes",
        icono: <FavoriteIcon />,
        ruta: "/pacientes",
      },
      {
        texto: "Terapeutas",
        icono: <MedicalServicesIcon />,
        ruta: "/terapeutas",
      },
      {
        texto: "Turnos",
        icono: <CalendarMonthIcon />,
        ruta: "/turnos",
      },
    ],
  },
  {
    titulo: "ÁREA EDUCATIVA",
    color: "#16a34a",
    opciones: [
      {
        texto: "Alumnos",
        icono: <PeopleIcon />,
        ruta: "/alumnos",
      },
      {
        texto: "Docentes",
        icono: <SchoolIcon />,
        ruta: "/docentes",
      },
      {
        texto: "Cursos",
        icono: <MenuBookIcon />,
        ruta: "/cursos",
      },
      {
        texto: "Inscripciones",
        icono: <SchoolIcon />,
        ruta: "/inscripciones",
      },
      {
        texto: "Clases",
        icono: <CalendarMonthIcon />,
        ruta: "/clases",
      },
    ],
  },
  {
    titulo: "ÁREA ADMINISTRATIVA",
    color: "#ea580c",
    opciones: [
      {
        texto: "Usuarios",
        icono: <PeopleIcon />,
        ruta: "/usuarios",
      },
      {
        texto: "Pagos",
        icono: <PaymentsIcon />,
        ruta: "/pagos",
      },
      {
        texto: "Reportes",
        icono: <BarChartIcon />,
        ruta: "/reportes",
      },
    ],
  },
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
      <Box
        sx={{
          px: 2,
          py: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          component="img"
          src={logoEstrella}
          alt="Logo Fundación La Estrella"
          sx={{
            width: 55,
            height: 55,
            objectFit: "contain",
            flexShrink: 0,
          }}
        />

        <Box>
          <Typography
            fontWeight="bold"
            sx={{
              fontSize: 16,
              lineHeight: 1.2,
              color: "#111827",
            }}
          >
            Fundación La Estrella
          </Typography>

          <Typography
            sx={{
              fontSize: 11,
              color: "#6b7280",
              mt: 0.4,
              lineHeight: 1.3,
            }}
          >
            Sistema Integral de Gestión
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ py: 1 }}>
        {seccionesMenu.map((seccion) => (
          <Box key={seccion.titulo} sx={{ mb: 1.5 }}>
            <Typography
              sx={{
                px: 2,
                pt: 1.5,
                pb: 0.8,
                fontSize: 12,
                fontWeight: 700,
                color: seccion.color,
                letterSpacing: 0.6,
                borderLeft: `4px solid ${seccion.color}`,
                ml: 1,
              }}
            >
              {seccion.titulo}
            </Typography>

            <List sx={{ px: 1, py: 0.5 }}>
              {seccion.opciones.map((opcion) => {
                const activo =
                  location.pathname === opcion.ruta ||
                  location.pathname.startsWith(`${opcion.ruta}/`);

                return (
                  <ListItemButton
                    key={opcion.texto}
                    selected={activo}
                    onClick={() => {
                      navigate(opcion.ruta);
                      setMenuAbierto(false);
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,

                      "& .MuiListItemIcon-root": {
                        color: activo ? seccion.color : "#6b7280",
                      },

                      "&.Mui-selected": {
                        backgroundColor: `${seccion.color}18`,
                        color: seccion.color,
                      },

                      "&.Mui-selected:hover": {
                        backgroundColor: `${seccion.color}24`,
                      },

                      "&:hover": {
                        backgroundColor: "#f3f4f6",
                      },
                    }}
                  >
                    <ListItemIcon>{opcion.icono}</ListItemIcon>

                    <ListItemText
                      primary={opcion.texto}
                      primaryTypographyProps={{
                        fontWeight: activo ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

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
            sx={{
              mr: 2,
              display: { md: "none" },
            }}
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
          minWidth: 0,
          minHeight: "100vh",
          bgcolor: "#f6f8fc",
          width: {
            xs: "100%",
            md: `calc(100% - ${drawerWidth}px)`,
          },
        }}
      >
        <Toolbar />

        <Box
          sx={{
            width: "100%",
            boxSizing: "border-box",
            px: {
              xs: 2,
              md: 3,
            },
            py: 3,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default MainLayout;
