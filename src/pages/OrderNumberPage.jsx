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
  Alert,
  Snackbar,
} from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useNavigate, useParams } from "react-router-dom";
import vendedora from "../img/Balconista.png";

const Illo = () => (
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

  // Se não vier param, tenta recuperar o último salvo
  React.useEffect(() => {
    if (!orderNumber) {
      const last = localStorage.getItem("lastOrderNumber");
      if (last) {
        navigate(`/numero/${last}`, { replace: true });
      }
    }
  }, [orderNumber, navigate]);

  const num = (orderNumber || "").toString().toUpperCase();

  // Salva localmente (garante que a tela também registre como "último número")
  React.useEffect(() => {
    if (num) {
      localStorage.setItem("lastOrderNumber", num);
      // opcional: guardar a data para lógica futura
      localStorage.setItem(
        "lastOrderSavedAt",
        new Date().toISOString()
      );
    }
  }, [num]);

  // (Opcional) Aviso ao sair da página: pode ser intrusivo em mobile.
  // React.useEffect(() => {
  //   const handler = (e) => {
  //     if (num) {
  //       e.preventDefault();
  //       e.returnValue = ""; // alguns browsers exigem string vazia
  //     }
  //   };
  //   window.addEventListener("beforeunload", handler);
  //   return () => window.removeEventListener("beforeunload", handler);
  // }, [num]);

  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(num);
      setCopied(true);
    } catch {}
  };

  const print = () => window.print();

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Meu número de pedido é: ${num}`);
    const url = `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

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
        {/* Aviso sutil para guardar o número */}
        {num && (
          <Alert
            severity="info"
            variant="outlined"
            sx={{
              width: "100%",
              borderRadius: 2,
              borderColor: "#93C5FD",
              bgcolor: "#EFF6FF",
            }}
          >
            Guarde seu número para acompanhamento. Você pode copiar, imprimir ou enviar por WhatsApp.
          </Alert>
        )}

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

        {/* Ações: copiar, imprimir, WhatsApp */}
        {num && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Tooltip title="Copiar">
              <Button
                variant="outlined"
                onClick={copy}
                startIcon={<ContentCopyRoundedIcon />}
                sx={{
                  textTransform: "none",
                  borderColor: "#F75724",
                  color: "#F75724",
                  "&:hover": { borderColor: "#e6491c", bgcolor: "#FFF1EB" },
                }}
              >
                Copiar
              </Button>
            </Tooltip>

            <Tooltip title="Imprimir">
              <Button
                variant="outlined"
                onClick={print}
                startIcon={<PrintRoundedIcon />}
                sx={{
                  textTransform: "none",
                  borderColor: "#F75724",
                  color: "#F75724",
                  "&:hover": { borderColor: "#e6491c", bgcolor: "#FFF1EB" },
                }}
              >
                Imprimir
              </Button>
            </Tooltip>

            <Tooltip title="Enviar por WhatsApp">
              <Button
                variant="contained"
                onClick={shareWhatsApp}
                startIcon={<WhatsAppIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: "#22c55e",
                  "&:hover": { bgcolor: "#16a34a" },
                }}
              >
                WhatsApp
              </Button>
            </Tooltip>
          </Stack>
        )}

        <Box sx={{ mt: 2 }}>
          <img src={vendedora} width={200} alt="Atendente" />
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

      <Snackbar
        open={copied}
        autoHideDuration={1800}
        onClose={() => setCopied(false)}
        message="Número copiado!"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
