import { Typography } from "@mui/material";

function Pagos() {
  return (
    <>
      <Typography variant="h4" fontWeight="bold">
        Gestión de pagos
      </Typography>

      <Typography color="text.secondary">
        Este módulo permitirá registrar pagos, consultar estados de cuenta y
        generar comprobantes.
      </Typography>
    </>
  );
}

export default Pagos;
