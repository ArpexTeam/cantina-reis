import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

const ResumoPedido = ({ quantidade = 0 }) => {
  const hasItems = Number(quantidade) > 0;

  return (
    <Box
      id="resumoPedido"
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: hasItems ? 0 : "-120px",
        zIndex: 10,
        transition: "bottom .28s ease-in-out",

        // Visual
        bgcolor: "#fff",
        borderTop: "1px solid #E5E7EB",
        boxShadow: "0 -6px 18px rgba(0,0,0,0.06)",
        fontFamily: "Poppins, sans-serif",

        // Padding com safe-area
        px: 2,
        py: 2,
        pb: { xs: "calc(12px + env(safe-area-inset-bottom))", md: 2 },

        // No desktop: centraliza e limita largura
        width: "100%",
        maxWidth: { md: 980, lg: 1200 },
        mx: { md: "auto" },
        borderTopLeftRadius: { md: 12 },
        borderTopRightRadius: { md: 12 },

        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      {/* Info à esquerda */}
      <Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, fontSize: 12, color: "#6B7280" }}
        >
          Itens selecionados
        </Typography>
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, fontSize: 16, whiteSpace: "nowrap" }}
        >
          {quantidade}
        </Typography>
      </Box>

      {/* Botão à direita */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          component={Link}
          to="/sacola"
          variant="contained"
          disabled={!hasItems}
          sx={{
            backgroundColor: "#F75724",
            "&:hover": { backgroundColor: "#e6491c" },
            fontWeight: 800,
            textTransform: "none",
            borderRadius: 1,
            px: 2,
            py: 1.2,
            fontSize: 13,
            boxShadow: "0 6px 18px rgba(255,107,44,.20)",
            whiteSpace: "nowrap",
            minWidth: { xs: 160, md: 200 },
          }}
        >
          Ver meus pedidos
        </Button>
      </Box>
    </Box>
  );
};

export default ResumoPedido;
