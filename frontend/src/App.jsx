import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { Box, Paper, Typography } from "@mui/material";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
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

const ADMIN = ROLES.ADMIN;
const ASISTENTE = ROLES.ASISTENTE;

function RutaProtegida() {
  const token = localStorage.getItem("token");
  const rol = obtenerRol();

  if (!token || !Object.values(ROLES).includes(rol)) {
    return <Navigate to="/" replace />;
  }

  return <MainLayout />;
}

function SoloRoles({ permitidos }) {
  const rol = obtenerRol();

  if (!permitidos.includes(rol)) {
    return <Navigate to={rutaInicial()} replace />;
  }

  return <Outlet />;
}

function PanelPersonal() {
  const usuario = obtenerUsuario();
  const rol = obtenerRol();

  const mensajes = {
    [ROLES.ASISTENTE]:
      "Gestioná las actividades de la fundación desde el menú.",
    [ROLES.ALUMNO]:
      "Próximamente podrás consultar tus cursos, clases y asistencias.",
    [ROLES.DOCENTE]:
      "Próximamente podrás gestionar tus cursos y registrar asistencias.",
    [ROLES.TERAPEUTA]:
      "Próximamente podrás consultar tus turnos y registrar sesiones.",
    [ROLES.PACIENTE]:
      "Próximamente podrás consultar tus turnos e historial autorizado.",
  };

  return (
    <Box sx={{ maxWidth: 850, mx: "auto", mt: 3 }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          ¡Bienvenido, {usuario?.nombre || "usuario"}!
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Fundación La Estrella
        </Typography>

        <Typography>
          {mensajes[rol] || "Bienvenido a tu espacio personal."}
        </Typography>
      </Paper>
    </Box>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route element={<RutaProtegida />}>
        <Route path="/mi-panel" element={<PanelPersonal />} />

        <Route element={<SoloRoles permitidos={[ADMIN]} />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/usuarios/nuevo" element={<FormularioUsuario />} />

          <Route path="/terapeutas" element={<Terapeutas />} />
          <Route path="/terapeutas/nuevo" element={<FormularioTerapeuta />} />
          <Route
            path="/terapeutas/:id/editar"
            element={<FormularioTerapeuta />}
          />

          <Route path="/docentes" element={<Docentes />} />
          <Route path="/docentes/nuevo" element={<FormularioDocente />} />
          <Route path="/docentes/:id/editar" element={<FormularioDocente />} />

          <Route path="/reportes" element={<Reportes />} />

          <Route
            path="/turnos/:idTurno/sesion"
            element={<FormularioSesion />}
          />
          <Route
            path="/pacientes/:idPaciente/historial"
            element={<HistorialPaciente />}
          />
        </Route>

        <Route element={<SoloRoles permitidos={[ADMIN, ASISTENTE]} />}>
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/nuevo" element={<FormularioPaciente />} />
          <Route
            path="/pacientes/:id/editar"
            element={<FormularioPaciente />}
          />

          <Route path="/alumnos" element={<Alumnos />} />
          <Route path="/alumnos/nuevo" element={<FormularioAlumno />} />
          <Route path="/alumnos/:id/editar" element={<FormularioAlumno />} />

          <Route path="/cursos" element={<Cursos />} />
          <Route path="/cursos/nuevo" element={<FormularioCurso />} />
          <Route path="/cursos/:id/editar" element={<FormularioCurso />} />

          <Route path="/turnos" element={<Turnos />} />
          <Route path="/turnos/nuevo" element={<FormularioTurno />} />
          <Route path="/turnos/:id/editar" element={<FormularioTurno />} />

          <Route path="/inscripciones" element={<Inscripciones />} />
          <Route
            path="/inscripciones/nueva"
            element={<FormularioInscripcion />}
          />

          <Route path="/clases" element={<Clases />} />
          <Route path="/clases/nueva" element={<FormularioClase />} />
          <Route path="/clases/:id/editar" element={<FormularioClase />} />
          <Route
            path="/clases/:idClase/asistencia"
            element={<TomarAsistencia />}
          />

          <Route path="/pagos" element={<Pagos />} />
          <Route path="/pagos/nuevo" element={<FormularioPago />} />
          <Route path="/pagos/:id/editar" element={<FormularioPago />} />
        </Route>
      </Route>

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
