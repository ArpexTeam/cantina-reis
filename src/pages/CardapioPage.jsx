// src/pages/CardapioPage.jsx
import React, { useEffect, useState } from "react";
import { Container, Box, Typography } from "@mui/material";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import background from "../../src/img/Frame26095426.jpg";
import TabSelection from "../componentes/TabSelection";
import ToolBar from "../componentes/ToolBar";
import ProductCard from "../componentes/productCard";
import ResumoPedido from "../componentes/resumoPedido";
import { useNavigate } from "react-router-dom";

function CardapioPage() {
  const navigate = useNavigate();
  const [quantidade, setQuantidade] = useState(0);
  const [produtos, setProdutos] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todas");
  const [abertoGeral, setAbertoGeral] = useState(false);

  const capitalizar = (texto) => {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  };

  const handleAbrirDetalhe = (id) => {
    navigate(`/individual/${id}`);
  };

  const fetchProdutos = async (categoria) => {
    try {
      let produtosRef = collection(db, "produtos");
      let q =
        categoria === "todas"
          ? produtosRef
          : query(produtosRef, where("categoria", "==", capitalizar(categoria)));

      const querySnapshot = await getDocs(q);
      const produtosFormatados = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProdutos(produtosFormatados);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
    }
  };

  const fetchConfiguracoes = async () => {
    try {
      const configRef = collection(db, "configuracoes");
      const querySnapshot = await getDocs(configRef);
      const cfg = querySnapshot.docs[0]?.data() || {};
      // tenta campos comuns: aberto / abertoGeral
      const flag =
        typeof cfg.aberto === "boolean"
          ? cfg.aberto
          : typeof cfg.abertoGeral === "boolean"
          ? cfg.abertoGeral
          : false;
      setAbertoGeral(flag);
    } catch (err) {
      console.log("erro ao buscar configurações", err);
    }
  };

  useEffect(() => {
    fetchProdutos(categoriaSelecionada);
    fetchConfiguracoes();
  }, [categoriaSelecionada]);

  useEffect(() => {
    const sacola = JSON.parse(localStorage.getItem("sacola")) || [];
    const quantity = sacola.reduce((acc, p) => acc + Number(p.quantity || 0), 0);

    if (quantity > 0) {
      setQuantidade(quantity);
      const resumoPedido = document.getElementById("resumoPedido");
      if (resumoPedido) resumoPedido.style.bottom = "0";
    } else {
      const resumoPedido = document.getElementById("resumoPedido");
      if (resumoPedido) resumoPedido.style.bottom = "-100%";
    }
  }, []);

  const handleAdicionarProduto = (produto) => {
    const sacola = JSON.parse(localStorage.getItem("sacola")) || [];

    const tamanhoSelecionado = produto.precos?.pequeno
      ? "pequeno"
      : produto.precos?.medio
      ? "medio"
      : produto.precos?.grande
      ? "grande"
      : null;

    const preco = tamanhoSelecionado
      ? parseFloat(produto.precos[tamanhoSelecionado] || 0)
      : 0;

    const existente = sacola.find(
      (p) => p.id === produto.id && p.tamanho === tamanhoSelecionado
    );

    if (existente) {
      existente.quantity += 1;
    } else {
      sacola.push({
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao || "",
        imagem: produto.imagem,
        tamanho: tamanhoSelecionado,
        precoSelecionado: preco,
        quantity: 1,
        guarnicoes: [],
        observacao: "",
      });
    }

    localStorage.setItem("sacola", JSON.stringify(sacola));

    const novaQuantidade = sacola.reduce((acc, p) => acc + p.quantity, 0);
    setQuantidade(novaQuantidade);

    const resumoPedido = document.getElementById("resumoPedido");
    if (resumoPedido) resumoPedido.style.bottom = "0";
  };

  // ✅ mantém a sacola persistente e corrige o listener de visibilidade
  useEffect(() => {
    const recalcularSacola = () => {
      const sacola = JSON.parse(localStorage.getItem("sacola")) || [];
      const total = sacola.reduce((acc, p) => acc + Number(p.quantity || 0), 0);
      setQuantidade(total);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        recalcularSacola();
      }
    };

    recalcularSacola();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <Container
      maxWidth="lg"
      sx={{
        display: "flex",
        alignItems: "stretch",
        flexDirection: "column",
        backgroundColor:'#F2F2F2',
        px: { xs: 0, sm: 2, md: 3 },
      }}
    >
      {/* HERO responsivo */}
      <Box
        sx={{
          width: "100%",
          height: { xs: 200, md: 320 }, // ↑ aumenta no desktop
          backgroundImage: `url(${background})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          borderRadius: { xs: 0, md: 2 },
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: 12,
            bottom: 12,
            backgroundColor: "#fff",
            color: abertoGeral ? "#00B856" : "#c00",
            fontSize: "12px",
            borderRadius: "6px",
            px: 1,
            py: 0.5,
            fontWeight: "bold",
            boxShadow: "0 2px 10px rgba(0,0,0,.08)",
          }}
        >
          {abertoGeral ? "🟢 Aberto" : "🔴 Fechado"}
        </Box>
      </Box>

      {/* Toolbar / Filtros */}
      <Box sx={{ width: "100%", mt: { xs: 2, md: 3 } }}>
        <ToolBar />
      </Box>

      {/* Tabs de categoria */}
      <Box sx={{ width: "100%", mt: 1, mb: { xs: 1, md: 2 } }}>
        <TabSelection onTabChange={setCategoriaSelecionada} />
      </Box>

      <Typography sx={{
        fontWeight:600,
        fontSize:'16px',
        width:'fit-content',
        paddingLeft:2,
        paddingTop:1,
        textTransform:'uppercase',
      }}>{categoriaSelecionada}</Typography>
      {/* GRID responsivo de produtos */}
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          padding:2,
          gap: { xs: 1, md: 3 },
          pb: { xs: 14, md: 16 }, // espaço p/ não ficar sob o resumo fixo
        }}
      >
        {produtos.map((produto) => (
          <Box key={produto.id}>
            <ProductCard
              produto={produto}
              onAdd={() => handleAdicionarProduto(produto)}
              onView={() => handleAbrirDetalhe(produto.id)}
            />
          </Box>
        ))}
      </Box>

      {/* Resumo fixo (já mobile-first) */}
      <ResumoPedido quantidade={quantidade} />
    </Container>
  );
}

export default CardapioPage;
