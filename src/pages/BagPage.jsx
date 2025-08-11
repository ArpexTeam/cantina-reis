import React, { useEffect, useState } from "react";
import { Container, Typography } from "@mui/material";
import BagItem from "../componentes/bagItem";
import ResumoBag from "../componentes/resumoBag";
import { IconButton, Box } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";

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
      p.id === id ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p
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
  (acc, p) => acc + (p.precoSelecionado || p.preco || 0) * p.quantity,
  0
);

  return (
    <Container maxWidth="sm" sx={{ mt: 2 }}>
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 2,
    }}>
      <IconButton onClick={() => navigate(-1)}>
        <ArrowBackIcon sx={{ color: '#000' }} />
      </IconButton>

      <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>
        Sacola
      </Typography>

      <IconButton onClick={() => navigate(-1)}>
        <CloseIcon sx={{ color: '#000' }} />
      </IconButton>
    </Box>

      {produtos.map((p) => (
        <BagItem
          key={p.id}
          {...p}
          onAdd={() => atualizarQuantidade(p.id, 1)}
          onRemove={() => atualizarQuantidade(p.id, -1)}
          onDelete={() => removerProduto(p.id)}
        />
      ))}

      <ResumoBag
        quantidade={produtos.length}
        total={total}
        servico={servico}
        onSelect={setServico}
        onFinalize={() => alert("Compra finalizada!")}
      />
    </Container>
  );
};

export default BagPage;
