const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensaje: "API Fundación La Estrella funcionando correctamente",
  });
});

app.use("/api/auth", authRoutes);

module.exports = app;
