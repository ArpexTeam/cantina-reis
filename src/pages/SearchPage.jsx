// src/pages/PesquisaPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  TextField,
  InputAdornment,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ToolBar from "../componentes/ToolBar";
import ProductCard from "../componentes/productCard";
import background from "../../src/img/Frame26095426.jpg";
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';

export default function SearchPage() {
  const [pesquisa, setPesquisa] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [resultado, setResultado] = useState([]);
  const [abertoGeral, setAbertoGeral] = useState(false);
  const navigate = useNavigate();

  // normaliza acentuação para busca
  const norm = (s) =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  // Carrega produtos + config
  useEffect(() => {
    const fetchProdutos = async () => {
      const snap = await getDocs(collection(db, 'produtos'));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProdutos(data);
      setResultado(data);
    };

    const fetchConfiguracoes = async () => {
      try {
        let aberto = false;
        try {
          const cfgDoc = await getDoc(doc(db, 'configuracoes', 'S7E8v2lrRGqeGUjH4sBV'));
          if (cfgDoc.exists()) {
            const d = cfgDoc.data();
            aberto = Boolean(typeof d.abertoGeral === 'boolean' ? d.abertoGeral : d.aberto);
          }
        } catch {}
        if (!aberto) {
          const snap = await getDocs(collection(db, 'configuracoes'));
          if (!snap.empty) {
            const d = snap.docs[0].data();
            aberto = Boolean(typeof d.abertoGeral === 'boolean' ? d.abertoGeral : d.aberto);
          }
        }
        setAbertoGeral(aberto);
      } catch (err) {
        console.log('erro ao buscar configurações', err);
      }
    };

    fetchProdutos().catch(console.error);
    fetchConfiguracoes().catch(console.error);
  }, []);

  // Filtra enquanto digita (nome e descrição)
  useEffect(() => {
    const q = norm(pesquisa);
    if (!q) {
      setResultado(produtos);
      return;
    }
    const filtrado = produtos.filter(
      (p) => norm(p.nome).includes(q) || norm(p.descricao).includes(q)
    );
    setResultado(filtrado);
  }, [pesquisa, produtos]);

  // Adiciona item à sacola (mesma regra do CardapioPage)
  const handleAddProduto = (produto) => {
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
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        bgcolor: '#F5F5F5',
        minHeight: '100vh',
        px: { xs: 0, sm: 2, md: 3 },
        py: { xs: 0, md: 4 },
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* HERO */}
      <Paper
        elevation={0}
        sx={{
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: { xs: 200, md: 260 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          borderRadius: { xs: 0, md: 2 },
          overflow: 'hidden',
          boxShadow: { xs: 'none', md: '0 2px 12px rgba(0,0,0,0.06)' },
          mb: { xs: 0, md: 2 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            right: 12,
            bottom: 12,
            backgroundColor: '#fff',
            color: abertoGeral ? '#00B856' : '#c00',
            fontSize: 12,
            borderRadius: '6px',
            px: 1,
            py: 0.5,
            fontWeight: 'bold',
            boxShadow: '0 2px 10px rgba(0,0,0,.08)',
          }}
        >
          {abertoGeral ? '🟢 Aberto' : '🔴 Fechado'}
        </Box>

        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2,
            bgcolor: 'rgba(0,0,0,.45)',
            '&:hover': { bgcolor: 'rgba(0,0,0,.6)' },
          }}
          aria-label="Fechar"
        >
          <CloseIcon sx={{ color: 'white' }} />
        </IconButton>
      </Paper>

      {/* ToolBar */}
      <ToolBar />

      {/* Campo de pesquisa */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          px: { xs: 2, md: 0 },
          py: 2,
        }}
      >
        <TextField
          fullWidth
          placeholder="Pesquisar"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          size="small"
          sx={{
            maxWidth: { xs: '100%', md: 720 },
            '& .MuiOutlinedInput-root': {
              bgcolor: '#fff',
              borderRadius: '20px',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#B0B0B0' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Contador */}
      <Box sx={{ px: { xs: 2, md: 0 }, mb: 1 }}>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          {resultado.length} {resultado.length === 1 ? 'resultado' : 'resultados'}
        </Typography>
      </Box>

      {/* Resultados — mesma largura para todos os cards */}
      <Box sx={{ px: { xs: 2, md: 0 }, pb: { xs: 6, md: 8 } }}>
        {resultado.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: 'center',
              borderRadius: 2,
              borderColor: '#E5E7EB',
              bgcolor: '#fff',
            }}
          >
            <Typography variant="body2">Nenhum resultado encontrado.</Typography>
          </Paper>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 2,
              alignItems: 'stretch',
            }}
          >
            {resultado.map((produto) => (
              <Box key={produto.id} sx={{ width: '100%' }}>
                <ProductCard
                  produto={produto}
                  onAdd={() => handleAddProduto(produto)}
                  onView={() => navigate(`/individual/${produto.id}`)}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
}
