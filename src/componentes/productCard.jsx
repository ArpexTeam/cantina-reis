// src/componentes/ProductCard.jsx
import React from "react";
import { Box, Typography, IconButton, Chip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

// Converte "R$ 1.234,56", "12,00" etc. para número (reais)
const toNumberBR = (v) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const s = v.trim().replace(/R\$\s?/i, "").replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
};

// menor preço > 0 entre pequeno/medio/executivo
const menorPreco = (precos = {}) =>
  ["pequeno", "medio", "executivo"]
    .map((k) => toNumberBR(precos?.[k]))
    .filter((v) => Number.isFinite(v) && v > 0)
    .sort((a, b) => a - b)[0];

export default function ProductCard({
  produto,
  onAdd,
  onView,
  semEstoque = false,
  // passe seu logo aqui (png/svg branco). Ex.: import cantinaLogo from "../../img/cantina-logo.png"
  fallbackLogo,
  // customize se quiser:
  fallbackGradient = "linear-gradient(135deg, #FF6B2C 0%, #111827 100%)",
  logoMaxWidth = "70%",
  logoMaxHeight = "70%",
}) {
  const { nome, descricao, imagem, precos } = produto ?? {};

  const precoNum = menorPreco(precos ?? {});
  const temPreco = Number.isFinite(precoNum);
  const precoFmt = temPreco
    ? precoNum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  // controle do fallback
  const [showFallback, setShowFallback] = React.useState(!imagem);

  React.useEffect(() => {
    setShowFallback(!imagem);
  }, [imagem]);

  // Pode adicionar apenas se tiver preço válido e tiver estoque
  const podeAdicionar = temPreco && !semEstoque;

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? onView?.() : null)}
      sx={{
        position: "relative",
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
        opacity: semEstoque ? 0.85 : 1,
      }}
    >
      {/* Selo Esgotado */}
      {semEstoque && (
        <Chip
          label="Esgotado"
          color="default"
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            bgcolor: "#9CA3AF",
            color: "#fff",
            fontWeight: 700,
          }}
        />
      )}

      {/* Área de imagem */}
      <Box
        sx={{
          width: "168px",
          height: "100px",
          borderRadius: "5px",
          overflow: "hidden",
          filter: semEstoque ? "grayscale(100%)" : "none",
          background: showFallback ? fallbackGradient : "#F3F4F6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!showFallback ? (
          <img
            src={imagem}
            alt={nome || "Produto"}
            loading="lazy"
            draggable={false}
            onError={() => setShowFallback(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : fallbackLogo ? (
          // Fallback com logo (menor) sobre gradient
          <img
            src={fallbackLogo}
            alt="Logo da cantina"
            draggable={false}
            style={{
              maxWidth: logoMaxWidth,
              maxHeight: logoMaxHeight,
              width: "auto",
              height: "auto",
              objectFit: "contain",
              display: "block",
              // dá contraste no logo branco
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))",
            }}
          />
        ) : (
          // fallback mínimo caso não tenha passado logo
          <Box
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              opacity: 0.9,
              letterSpacing: 1,
            }}
          >
            CANTINA
          </Box>
        )}
      </Box>

      {/* Texto */}
      <Box sx={{ minWidth: 0, textAlign: "left" }}>
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
          {temPreco ? `R$ ${precoFmt}` : "Consultar"}
        </Typography>
      </Box>

      {/* Botão + */}
      <IconButton
        aria-label={semEstoque ? "Produto esgotado" : "Adicionar ao carrinho"}
        onClick={(e) => {
          e.stopPropagation();
          if (podeAdicionar) onAdd?.();
        }}
        disabled={!podeAdicionar}
        sx={{
          justifySelf: "end",
          alignSelf: "center",
          width: 32,
          height: 32,
          borderRadius: "8px",
          bgcolor: podeAdicionar ? "#FF6B2C" : "#F3F4F6",
          color: podeAdicionar ? "#fff" : "#9CA3AF",
          marginTop: 6,
          "&:hover": { bgcolor: podeAdicionar ? "#e64c1a" : "#F3F4F6" },
        }}
      >
        <AddIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );
}
