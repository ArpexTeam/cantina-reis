// src/pages/BagPage.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  IconButton,
  Box,
  Paper,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";

import BagItem from "../componentes/bagItem";
import ResumoBag from "../componentes/resumoBag";

const BagPage = () => {
  const [produtos, setProdutos] = useState([]);
  const [servico, setServico] = useState("");
  const navigate = useNavigate();

  const carregarSacola = () => {
    const sacolaSalva = JSON.parse(localStorage.getItem("sacola")) || [];
    setProdutos(sacolaSalva);
  };

  useEffect(() => {
    carregarSacola();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        carregarSacola();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const atualizarQuantidade = (id, delta) => {
    const atualizada = produtos.map((p) =>
      p.id === id ? { ...p, quantity: Math.max(1, (p.quantity || 1) + delta) } : p
    );
    setProdutos(atualizada);
    localStorage.setItem("sacola", JSON.stringify(atualizada));
  };

  const removerProduto = (id) => {
    const filtrada = produtos.filter((p) => p.id !== id);
    setProdutos(filtrada);
    localStorage.setItem("sacola", JSON.stringify(filtrada));
  };

  const total = produtos.reduce(
    (acc, p) => acc + (Number(p.precoSelecionado ?? p.preco ?? 0) * Number(p.quantity || 0)),
    0
  );

  // quantidade real (soma das quantidades)
  const quantidadeReal = produtos.reduce((acc, p) => acc + Number(p.quantity || 0), 0);

  return (
    <Container
      maxWidth="lg"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        px: { xs: 0, sm: 2, md: 3 },
        py: { xs: 0, md: 4 },
        bgcolor: "#F2F2F2",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Header (mobile-first) */}
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          bgcolor: "#FFF",
          borderBottom: { xs: "1px solid #E5E7EB", md: "none" },
          borderRadius: { xs: 0, md: 2 },
          mb: { xs: 0, md: 2 },
        }}
      >
        <IconButton onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowBackIcon sx={{ color: "#000" }} />
        </IconButton>

        <Typography
          variant="h6"
          sx={{ fontWeight: 600, fontSize: { xs: 16, md: 18 } }}
        >
          Sacola
        </Typography>

        <IconButton onClick={() => navigate(-1)} aria-label="Fechar">
          <CloseIcon sx={{ color: "#000" }} />
        </IconButton>
      </Paper>

      {/* Conteúdo */}
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr" }, // pronto para futura coluna lateral, se quiser
          gap: { xs: 0, md: 3 },
          alignItems: "start",
          justifyItems: "center",
          backgroundColor:'#F2F2F2',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", md: 900 },
            bgcolor: "#F2F2F2",
            borderRadius: { xs: 0, md: 2 },
            p: { xs: 1, md: 2 },
            boxShadow: { xs: "none", md: "0 2px 12px rgba(0,0,0,0.06)" },
          }}
        >
          {/* Lista de itens com espaço inferior para o ResumoBag fixo */}
          <Box sx={{ pb: { xs: 14, md: 16 } }}>
            {produtos.length ? (
              produtos.map((p) => (
                <BagItem
                  key={p.id}
                  {...p}
                  onAdd={() => atualizarQuantidade(p.id, 1)}
                  onRemove={() => atualizarQuantidade(p.id, -1)}
                  onDelete={() => removerProduto(p.id)}
                />
              ))
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: { xs: 6, md: 8 },
                  color: "#6B7280",
                }}
              >
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  Sua sacola está vazia
                </Typography>
                <Typography variant="body2">
                  Adicione itens do cardápio para continuar.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Resumo fixo (mobile e desktop) */}
      <ResumoBag
        quantidade={quantidadeReal}
        total={total}
        servico={servico}
        onSelect={setServico}
      />
    </Container>
  );
};

export default BagPage;
