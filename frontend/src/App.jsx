import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Box, Paper, Typography } from "@mui/material";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PanelAlumno from "./pages/PanelAlumno";
import PanelDocente from "./pages/PanelDocente";

import Usuarios from "./pages/Usuarios";
import FormularioUsuario from "./pages/FormularioUsuario";
import Pacientes from "./pages/Pacientes";
import FormularioPaciente from "./pages/FormularioPaciente";
import Alumnos from "./pages/Alumnos";
import FormularioAlumno from "./pages/FormularioAlumno";
import Cursos from "./pages/Cursos";
import FormularioCurso from "./pages/FormularioCurso";
import Turnos from "./pages/Turnos";
import FormularioTurno from "./pages/FormularioTurno";
import Pagos from "./pages/Pagos";
import FormularioPago from "./pages/FormularioPago";
import Reportes from "./pages/Reportes";
import Terapeutas from "./pages/Terapeutas";
import FormularioTerapeuta from "./pages/FormularioTerapeuta";
import FormularioSesion from "./pages/FormularioSesion";
import HistorialPaciente from "./pages/HistorialPaciente";
import Docentes from "./pages/Docentes";
import FormularioDocente from "./pages/FormularioDocente";
import Inscripciones from "./pages/Inscripciones";
import FormularioInscripcion from "./pages/FormularioInscripcion";
import Clases from "./pages/Clases";
import FormularioClase from "./pages/FormularioClase";
import TomarAsistencia from "./pages/TomarAsistencia";

import MainLayout from "./layouts/MainLayout";

import {
  ROLES,
  obtenerRol,
  obtenerUsuario,
  rutaInicial,
} from "./config/permisos";

// ======================================
// ROLES
// ======================================

const ADMINISTRACION = [ROLES.ADMIN, ROLES.ASISTENTE];

const ROLES_ASISTENCIA = [...ADMINISTRACION, ROLES.DOCENTE];

// ======================================
// PROTEGER RUTAS
// ======================================

function RutaProtegida() {
  const token = localStorage.getItem("token");
  const rol = obtenerRol();

  if (!token || !Object.values(ROLES).includes(rol)) {
    return <Navigate to="/" replace />;
  }

  return <MainLayout />;
}

// ======================================
// VERIFICAR ROLES
// ======================================

function SoloRoles({ permitidos }) {
  if (!permitidos.includes(obtenerRol())) {
    return <Navigate to={rutaInicial()} replace />;
  }

  return <Outlet />;
}

// ======================================
// PANEL SEGÚN EL ROL
// ======================================

function PanelPersonal() {
  const usuario = obtenerUsuario();
  const rol = obtenerRol();

  // Administrador y asistente
  if (ADMINISTRACION.includes(rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Alumno
  if (rol === ROLES.ALUMNO) {
    return <PanelAlumno />;
  }

  // Docente
  if (rol === ROLES.DOCENTE) {
    return <PanelDocente />;
  }

  // Paneles pendientes
  const mensajes = {
    [ROLES.TERAPEUTA]: "Aquí vas a consultar tus pacientes, turnos y sesiones.",

    [ROLES.PACIENTE]: "Aquí vas a consultar tus turnos e historial personal.",
  };

  return (
    <Box sx={{ maxWidth: 850, mx: "auto", mt: 3 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          ¡Bienvenido, {usuario?.nombre || "usuario"}!
        </Typography>

        <Typography color="text.secondary">
          {mensajes[rol] || "Bienvenido a Fundación La Estrella."}
        </Typography>
      </Paper>
    </Box>
  );
}

// ======================================
// RUTAS PRINCIPALES
// ======================================

function App() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/" element={<Login />} />

      {/* RUTAS CON AUTENTICACIÓN */}
      <Route element={<RutaProtegida />}>
        {/* PANEL PERSONAL */}
        <Route path="/mi-panel" element={<PanelPersonal />} />

        {/* ================================= */}
        {/* ASISTENCIA: ADMIN, ASISTENTE Y DOCENTE */}
        {/* ================================= */}

        <Route element={<SoloRoles permitidos={ROLES_ASISTENCIA} />}>
          <Route
            path="/clases/:idClase/asistencia"
            element={<TomarAsistencia />}
          />
        </Route>

        {/* ================================= */}
        {/* ADMINISTRADOR Y ASISTENTE */}
        {/* ================================= */}

        <Route element={<SoloRoles permitidos={ADMINISTRACION} />}>
          {/* DASHBOARD */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* USUARIOS */}
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/usuarios/nuevo" element={<FormularioUsuario />} />

          {/* TERAPEUTAS */}
          <Route path="/terapeutas" element={<Terapeutas />} />
          <Route path="/terapeutas/nuevo" element={<FormularioTerapeuta />} />
          <Route
            path="/terapeutas/:id/editar"
            element={<FormularioTerapeuta />}
          />

          {/* DOCENTES */}
          <Route path="/docentes" element={<Docentes />} />
          <Route path="/docentes/nuevo" element={<FormularioDocente />} />
          <Route path="/docentes/:id/editar" element={<FormularioDocente />} />

          {/* PACIENTES */}
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/nuevo" element={<FormularioPaciente />} />
          <Route
            path="/pacientes/:id/editar"
            element={<FormularioPaciente />}
          />
          <Route
            path="/pacientes/:idPaciente/historial"
            element={<HistorialPaciente />}
          />

          {/* ALUMNOS */}
          <Route path="/alumnos" element={<Alumnos />} />
          <Route path="/alumnos/nuevo" element={<FormularioAlumno />} />
          <Route path="/alumnos/:id/editar" element={<FormularioAlumno />} />

          {/* CURSOS */}
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/cursos/nuevo" element={<FormularioCurso />} />
          <Route path="/cursos/:id/editar" element={<FormularioCurso />} />

          {/* INSCRIPCIONES */}
          <Route path="/inscripciones" element={<Inscripciones />} />
          <Route
            path="/inscripciones/nueva"
            element={<FormularioInscripcion />}
          />

          {/* CLASES */}
          <Route path="/clases" element={<Clases />} />
          <Route path="/clases/nueva" element={<FormularioClase />} />
          <Route path="/clases/:id/editar" element={<FormularioClase />} />

          {/* TURNOS */}
          <Route path="/turnos" element={<Turnos />} />
          <Route path="/turnos/nuevo" element={<FormularioTurno />} />
          <Route path="/turnos/:id/editar" element={<FormularioTurno />} />
          <Route
            path="/turnos/:idTurno/sesion"
            element={<FormularioSesion />}
          />

          {/* PAGOS */}
          <Route path="/pagos" element={<Pagos />} />
          <Route path="/pagos/nuevo" element={<FormularioPago />} />
          <Route path="/pagos/:id/editar" element={<FormularioPago />} />

          {/* REPORTES */}
          <Route path="/reportes" element={<Reportes />} />
        </Route>
      </Route>

      {/* RUTAS NO ENCONTRADAS */}
      <Route
        path="*"
        element={
          <Navigate
            to={localStorage.getItem("token") ? rutaInicial() : "/"}
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;
