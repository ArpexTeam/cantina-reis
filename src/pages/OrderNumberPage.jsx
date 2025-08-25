// src/pages/OrderNumberPage.jsx
import React from "react";
import {
  Box,
  Container,
  Typography,
  IconButton,
  Button,
  Divider,
  Stack,
  Tooltip,
} from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import { useNavigate, useParams } from "react-router-dom";

const Illo = () => (
  // Ilustração simples (SVG inline). Troque por <img src="/img/..." /> se preferir.
  <svg width="180" height="120" viewBox="0 0 300 200" role="img" aria-label="Atendente no caixa">
    <rect x="0" y="170" width="300" height="12" fill="#F75724" />
    <rect x="40" y="140" width="220" height="35" rx="6" fill="#DDDDDD" />
    <circle cx="95" cy="105" r="22" fill="#F4B183" />
    <rect x="78" y="120" width="34" height="24" rx="8" fill="#F75724" />
    <rect x="120" y="120" width="120" height="14" rx="3" fill="#C9CDD4" />
    <rect x="120" y="138" width="80" height="9" rx="3" fill="#E3E6EC" />
    <polygon points="210,70 260,55 260,90" fill="#FF8A5B" />
  </svg>
);

export default function OrderNumberPage() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();

  const num = (orderNumber || "").toString().toUpperCase();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(num);
    } catch {}
  };

  const print = () => window.print();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f7f7f7",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          bgcolor: "#fff",
          borderBottom: "1px solid #E5E7EB",
          zIndex: 10,
        }}
      >
        <Container maxWidth="sm" sx={{ display: "flex", alignItems: "center", py: 1 }}>
          <IconButton onClick={() => navigate(-1)} size="small">
            <ArrowBackIosNewRoundedIcon fontSize="small" />
          </IconButton>
          <Typography sx={{ flex: 1, textAlign: "center", fontWeight: 700 }}>
            Número do pedido
          </Typography>
          <IconButton onClick={() => navigate("/")} size="small" aria-label="Fechar">
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Container>
      </Box>

      {/* Content */}
      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          py: 4,
          gap: 2,
        }}
      >
        <Typography variant="body1" sx={{ color: "#6B7280", fontWeight: 500 }}>
          Aguarde ser chamado pelo número do seu pedido!
        </Typography>

        <Typography sx={{ fontWeight: 800, letterSpacing: 0.3, color: "#111827" }}>
          NÚMERO DO PEDIDO É:
        </Typography>

        <Typography
          component="div"
          sx={{
            fontSize: { xs: 64, sm: 72 },
            lineHeight: 1,
            fontWeight: 900,
            color: "#000",
          }}
        >
          {num || "— — — — —"}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Tooltip title="Copiar número">
            <IconButton onClick={copy}>
              <ContentCopyRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Imprimir">
            <IconButton onClick={print}>
              <PrintRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box sx={{ mt: 1 }}>
          <Illo />
        </Box>

        <Typography sx={{ color: "#6B7280", fontWeight: 600, mt: 1 }}>
          Agradecemos sua preferência.
          <br />
          Tenha uma ótima refeição!
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate("/cardapio")}
          sx={{
            mt: 2,
            textTransform: "none",
            fontWeight: 800,
            bgcolor: "#F75724",
            "&:hover": { bgcolor: "#e6491c" },
            borderRadius: 1,
            px: 2.5,
          }}
        >
          Voltar ao cardápio
        </Button>
      </Container>


    </Box>
  );
}
