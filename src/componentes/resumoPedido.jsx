import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from 'react-router-dom';

const ResumoPedido = ({ quantidade }) => {
  return (
    <Box
      id="resumoPedido"
      sx={{
        paddingX:1,
        paddingY:2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        width: "100%",
        fontFamily: "sans-serif",
        borderTop:"2px solid #D9D9D9",
        position:"fixed",
        bottom:"-100px",
        transition:"all 0.2s linear",
      }}
    >
      {/* Texto à esquerda */}
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 400, fontSize:"12px" }}>
          Itens selecionados:
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize:"16px", textWrap:'nowrap' }}>
          {quantidade}
        </Typography>
      </Box>

      {/* Botões à direita */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          component={Link}
          to="/sacola"
          variant="contained"
          sx={{
            backgroundColor: "#F75724",
            "&:hover": {
              backgroundColor: "#e6491c",
            },
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "6px",
            paddingX: 1.5,
            paddingY:1.5,
            textWrap:"nowrap",
          }}
        >
          Ver meus pedidos
        </Button>

      </Box>
    </Box>
  );
};

export default ResumoPedido;
