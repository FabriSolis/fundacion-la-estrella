const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const rolRoutes = require("./routes/rolRoutes");
const pacienteRoutes = require("./routes/pacienteRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const terapeutaRoutes = require("./routes/terapeutaRoutes");
const turnoRoutes = require("./routes/turnoRoutes");
const sesionRoutes = require("./routes/sesionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensaje: "API Fundación La Estrella funcionando correctamente",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/roles", rolRoutes);
app.use("/api/pacientes", pacienteRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/terapeutas", terapeutaRoutes);
app.use("/api/turnos", turnoRoutes);
app.use("/api/sesiones", sesionRoutes);

module.exports = app;
