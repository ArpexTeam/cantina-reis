// src/pages/CardapioPage.jsx
import React, { useEffect, useState } from "react";
import { Container } from "@mui/material";
import { Box } from "@mui/system";
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
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  };

  const handleAbrirDetalhe = (id) => {
    navigate(`/individual/${id}`);
  };

  const fetchProdutos = async (categoria) => {
    try {
      let produtosRef = collection(db, "produtos");
      let q = categoria === "todas"
        ? produtosRef
        : query(produtosRef, where("categoria", "==", capitalizar(categoria)));

      const querySnapshot = await getDocs(q);
      const produtosFormatados = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProdutos(produtosFormatados);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
    }
  };

  useEffect(() => {
    fetchProdutos(categoriaSelecionada);

  }, [categoriaSelecionada]);

useEffect(() => {
  const sacola = JSON.parse(localStorage.getItem("sacola")) || [];
  let quantity = 0;

  sacola.map(p => {
    quantity += p.quantity;
  });

  console.log(quantity); // Debug: mostra valor real

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

    const tamanhoSelecionado =
      produto.precos?.pequeno ? "pequeno"
      : produto.precos?.medio ? "medio"
      : produto.precos?.grande ? "grande"
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

  // ✅ MANTÉM A SACOLA PERSISTENTE mesmo após atualizar ou voltar para a página
  useEffect(() => {
    const recalcularSacola = () => {
      const sacola = JSON.parse(localStorage.getItem("sacola")) || [];
      const total = sacola.reduce((acc, p) => acc + p.quantity, 0);
      setQuantidade(total);
    };

    recalcularSacola();

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        recalcularSacola();
      }
    });

    return () => {
      document.removeEventListener("visibilitychange", recalcularSacola);
    };
  }, []);

  return (
    <Container
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100vw",
          height: "200px",
          backgroundImage: `url(${background})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            backgroundColor: '#fff',
            color: abertoGeral ? '#00B856' : '#c00',
            fontSize: '12px',
            borderRadius: '5px',
            padding: '2px 6px',
            fontWeight: 'bold',
          }}
        >
          {abertoGeral ? '🟢 Aberto' : '🔴 Fechado'}
        </Box>
      </Box>

      <ToolBar />

      <TabSelection onTabChange={setCategoriaSelecionada} />

      {produtos.map((produto) => (
        <ProductCard
          key={produto.id}
          produto={produto}
          onAdd={() => handleAdicionarProduto(produto)}
          onView={() => handleAbrirDetalhe(produto.id)}
        />
      ))}

    <ResumoPedido quantidade={quantidade} />
    </Container>
  );
}

export default CardapioPage;
