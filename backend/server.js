require("dotenv").config();

const app = require("./src/app");
const { conectarBaseDeDatos } = require("./src/config/database");

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    await conectarBaseDeDatos();

    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("El servidor no se inició porque falló la base de datos.");
    process.exit(1);
  }
}

iniciarServidor();
