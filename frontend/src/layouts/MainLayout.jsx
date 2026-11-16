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

import {
  ROLES,
  obtenerRol,
  obtenerUsuario,
  rutaInicial,
} from "../config/permisos";

const drawerWidth = 250;

const ADMIN = ROLES.ADMIN;
const ASISTENTE = ROLES.ASISTENTE;

const secciones = [
  {
    titulo: "ÁREA TERAPÉUTICA",
    color: "#7c3aed",
    opciones: [
      {
        texto: "Pacientes",
        ruta: "/pacientes",
        icono: FavoriteIcon,
        roles: [ADMIN, ASISTENTE],
      },
      {
        texto: "Terapeutas",
        ruta: "/terapeutas",
        icono: MedicalServicesIcon,
        roles: [ADMIN],
      },
      {
        texto: "Turnos",
        ruta: "/turnos",
        icono: CalendarMonthIcon,
        roles: [ADMIN, ASISTENTE],
      },
    ],
  },
  {
    titulo: "ÁREA EDUCATIVA",
    color: "#16a34a",
    opciones: [
      {
        texto: "Alumnos",
        ruta: "/alumnos",
        icono: PeopleIcon,
        roles: [ADMIN, ASISTENTE],
      },
      {
        texto: "Docentes",
        ruta: "/docentes",
        icono: SchoolIcon,
        roles: [ADMIN],
      },
      {
        texto: "Cursos",
        ruta: "/cursos",
        icono: MenuBookIcon,
        roles: [ADMIN, ASISTENTE],
      },
      {
        texto: "Inscripciones",
        ruta: "/inscripciones",
        icono: SchoolIcon,
        roles: [ADMIN, ASISTENTE],
      },
      {
        texto: "Clases",
        ruta: "/clases",
        icono: CalendarMonthIcon,
        roles: [ADMIN, ASISTENTE],
      },
    ],
  },
  {
    titulo: "ÁREA ADMINISTRATIVA",
    color: "#ea580c",
    opciones: [
      {
        texto: "Usuarios",
        ruta: "/usuarios",
        icono: PeopleIcon,
        roles: [ADMIN],
      },
      {
        texto: "Pagos",
        ruta: "/pagos",
        icono: PaymentsIcon,
        roles: [ADMIN, ASISTENTE],
      },
      {
        texto: "Reportes",
        ruta: "/reportes",
        icono: BarChartIcon,
        roles: [ADMIN],
      },
    ],
  },
];

const nombresPanel = {
  [ROLES.ADMIN]: "Panel administrativo",
  [ROLES.ASISTENTE]: "Panel de administración",
  [ROLES.DOCENTE]: "Panel del docente",
  [ROLES.TERAPEUTA]: "Panel del terapeuta",
  [ROLES.ALUMNO]: "Panel del alumno",
  [ROLES.PACIENTE]: "Panel del paciente",
};

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuAbierto, setMenuAbierto] = useState(false);

  const usuario = obtenerUsuario() || {};
  const rol = obtenerRol();

  const menu = [
    {
      titulo: "GENERAL",
      color: "#2563eb",
      opciones: [
        {
          texto: rol === ADMIN ? "Dashboard" : "Mi panel",
          ruta: rutaInicial(),
          icono: DashboardIcon,
        },
      ],
    },
    ...secciones
      .map((seccion) => ({
        ...seccion,
        opciones: seccion.opciones.filter((opcion) =>
          opcion.roles.includes(rol),
        ),
      }))
      .filter((seccion) => seccion.opciones.length > 0),
  ];

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/", { replace: true });
  };

  const contenidoMenu = (
    <Box>
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          component="img"
          src={logoEstrella}
          alt="Fundación La Estrella"
          sx={{ width: 55, height: 55, objectFit: "contain" }}
        />

        <Box>
          <Typography fontWeight={700} fontSize={15}>
            Fundación La Estrella
          </Typography>

          <Typography fontSize={11} color="text.secondary">
            Sistema Integral de Gestión
          </Typography>
        </Box>
      </Box>

      <Divider />

      {menu.map((seccion) => (
        <Box key={seccion.titulo} sx={{ mt: 2 }}>
          <Typography
            sx={{
              px: 2,
              fontSize: 11,
              fontWeight: 700,
              color: seccion.color,
            }}
          >
            {seccion.titulo}
          </Typography>

          <List sx={{ px: 1 }}>
            {seccion.opciones.map((opcion) => {
              const Icono = opcion.icono;

              const activo =
                location.pathname === opcion.ruta ||
                location.pathname.startsWith(`${opcion.ruta}/`);

              return (
                <ListItemButton
                  key={opcion.ruta}
                  selected={activo}
                  onClick={() => {
                    navigate(opcion.ruta);
                    setMenuAbierto(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    "&.Mui-selected": {
                      backgroundColor: `${seccion.color}18`,
                      color: seccion.color,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: activo ? seccion.color : "#6b7280",
                    }}
                  >
                    <Icono />
                  </ListItemIcon>

                  <ListItemText primary={opcion.texto} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      <List sx={{ px: 1 }}>
        <ListItemButton
          onClick={cerrarSesion}
          sx={{ borderRadius: 2, color: "error.main" }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
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
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => setMenuAbierto(true)}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {nombresPanel[rol] || "Mi panel"}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2" fontWeight={700}>
                {usuario.nombre} {usuario.apellido}
              </Typography>

              <Typography variant="caption">
                {usuario.rol?.nombre_rol ||
                  usuario.rol?.nombre ||
                  (typeof usuario.rol === "string" ? usuario.rol : rol)}
              </Typography>
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
          "& .MuiDrawer-paper": { width: drawerWidth },
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
          bgcolor: "#f6f8fc",
          minHeight: "100vh",
        }}
      >
        <Toolbar />

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default MainLayout;
