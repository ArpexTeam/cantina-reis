import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const menorPreco = (precos = {}) =>
  ["pequeno", "medio", "grande"]
    .map((k) => Number(precos?.[k]))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)[0];

export default function ProductCard({ produto, onAdd, onView }) {
  const { nome, descricao, imagem, precos } = produto ?? {};
  const precoNum = menorPreco(precos ?? {});
  const precoFmt = Number(precoNum ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? onView?.() : null)}
      sx={{
        display: "grid",
        gridTemplateColumns: "168px 1fr 40px",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        bgcolor: "#FFFFFF",
        border: "1px solid #E6E6E6",
        borderRadius: "5px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        p: "6px",
        cursor: "pointer",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Imagem */}
      <Box sx={{ width: "168px", height: "100px", borderRadius: "5px", overflow: "hidden" }}>
        <img
          src={imagem}
          alt={nome}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </Box>

      {/* Texto */}
      <Box sx={{ minWidth: 0, textAlign:'left'}}>
        <Typography
          title={nome}
          sx={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 600,
            fontSize: "12px",
            color: "#111827",
            lineHeight: 1.2,
            mb: "6px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {nome}
        </Typography>

        {descricao ? (
          <Typography
            sx={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 300,
              fontSize: "13px",
              color: "#4B5563",
              lineHeight: 1.35,
              mb: "10px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {descricao}
          </Typography>
        ) : null}

        <Typography
          sx={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            color: "#111827",
          }}
        >
          R${precoFmt}
        </Typography>
      </Box>

      {/* Botão + */}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onAdd?.();
        }}
        sx={{
          justifySelf: "end",
          alignSelf: "center",
          width: 32,
          height: 32,
          borderRadius: "8px",
          bgcolor: "#FF6B2C",
          color: "#fff",
          marginTop:6,
          "&:hover": { bgcolor: "#e64c1a" },
        }}
      >
        <AddIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );
}
