import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import FormularioUsuario from "./pages/FormularioUsuario";
import Pacientes from "./pages/Pacientes";
import Alumnos from "./pages/Alumnos";
import Cursos from "./pages/Cursos";
import Turnos from "./pages/Turnos";
import Pagos from "./pages/Pagos";
import Reportes from "./pages/Reportes";
import FormularioPaciente from "./pages/FormularioPaciente";
import Terapeutas from "./pages/Terapeutas";
import FormularioTerapeuta from "./pages/FormularioTerapeuta";
import FormularioTurno from "./pages/FormularioTurno";
import MainLayout from "./layouts/MainLayout";
import FormularioSesion from "./pages/FormularioSesion";
import HistorialPaciente from "./pages/HistorialPaciente";
import FormularioAlumno from "./pages/FormularioAlumno";
import FormularioCurso from "./pages/FormularioCurso";
import Docentes from "./pages/Docentes";
import FormularioDocente from "./pages/FormularioDocente";
import Inscripciones from "./pages/Inscripciones";
import FormularioInscripcion from "./pages/FormularioInscripcion";
import Clases from "./pages/Clases";
import FormularioClase from "./pages/FormularioClase";
import TomarAsistencia from "./pages/TomarAsistencia";
import FormularioPago from "./pages/FormularioPago";

function RutaProtegida({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        element={
          <RutaProtegida>
            <MainLayout />
          </RutaProtegida>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/usuarios/nuevo" element={<FormularioUsuario />} />
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/pacientes/nuevo" element={<FormularioPaciente />} />
        <Route path="/pacientes/:id/editar" element={<FormularioPaciente />} />
        <Route path="/alumnos" element={<Alumnos />} />
        <Route path="/cursos" element={<Cursos />} />
        <Route path="/turnos" element={<Turnos />} />
        <Route path="/turnos/nuevo" element={<FormularioTurno />} />
        <Route path="/turnos/:id/editar" element={<FormularioTurno />} />
        <Route path="/sesiones/nueva/:idTurno" element={<FormularioSesion />} />
        <Route path="/pagos" element={<Pagos />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/terapeutas" element={<Terapeutas />} />
        <Route path="/terapeutas/nuevo" element={<FormularioTerapeuta />} />
        <Route
          path="/terapeutas/:id/editar"
          element={<FormularioTerapeuta />}
        />
        <Route
          path="/pacientes/:idPaciente/historial"
          element={<HistorialPaciente />}
        />
        <Route path="/cursos/nuevo" element={<FormularioCurso />} />
        <Route path="/cursos/:id/editar" element={<FormularioCurso />} />
        <Route path="/alumnos" element={<Alumnos />} />
        <Route path="/alumnos/nuevo" element={<FormularioAlumno />} />
        <Route path="/alumnos/:id/editar" element={<FormularioAlumno />} />
        <Route path="/docentes" element={<Docentes />} />
        <Route path="/docentes/nuevo" element={<FormularioDocente />} />
        <Route path="/docentes/:id/editar" element={<FormularioDocente />} />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
