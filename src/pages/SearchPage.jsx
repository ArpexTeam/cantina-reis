// src/pages/PesquisaPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  TextField,
  InputAdornment,
  Button,
  Typography,
  IconButton,
  Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import ToolBar from "../componentes/ToolBar";
import background from "../../src/img/Frame26095426.jpg";
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';

export default function SearchPage() {
  const [pesquisa, setPesquisa] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [resultado, setResultado] = useState([]);
    const [abertoGeral, setAbertoGeral] = useState(false);
    const navigate = useNavigate();

  // Carrega todos produtos ao iniciar
  useEffect(() => {
    const fetchProdutos = async () => {
      const q = query(collection(db, 'produtos'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProdutos(data);
      setResultado(data); // mostra tudo no início
    };
    fetchProdutos();
  }, []);

  // Filtra enquanto digita
  useEffect(() => {
    const filtrado = produtos.filter((p) =>
      p.nome.toLowerCase().includes(pesquisa.toLowerCase())
    );
    setResultado(filtrado);
  }, [pesquisa, produtos]);

  return (
    <Container maxWidth="xs" sx={{ bgcolor: '#F5F5F5', minHeight: '100vh', p: 0 }}>
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
          position:'relative',
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
            <IconButton
          onClick={() => navigate(-1)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2
          }}
        >
          <CloseIcon sx={{ color: 'white' }} />
  </IconButton>
      </Box>

      <ToolBar />

      {/* Campo de pesquisa */}
      <Box sx={{ px: 2, py: 2 }}>
        <TextField
          fullWidth
          placeholder="Pesquisar"
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#B0B0B0' }} />
              </InputAdornment>
            ),
            sx: {
              bgcolor: '#fff',
              borderRadius: '20px',
            },
          }}
        />
      </Box>

      {/* Resultados */}
      <Box sx={{ px: 2 }}>
        {resultado.length === 0 ? (
          <Typography variant="body2">Nenhum resultado encontrado.</Typography>
        ) : (
          resultado.map((produto) => (
          <Box
          key={produto.id}
          onClick={() => navigate(`/individual/${produto.id}`)} // ⚡ Abre ProdutoIndividual
          sx={{
            bgcolor: '#fff',
            p: 2,
            borderRadius: 2,
            mb: 1,
            boxShadow: 1,
            cursor: 'pointer',
            transition: 'transform 0.1s',
            '&:hover': {
              transform: 'scale(1.02)',
              boxShadow: 3,
            },
          }}
        >
          <Typography fontWeight="bold">{produto.nome}</Typography>
          <Typography variant="body2">{produto.descricao}</Typography>
        </Box>
          ))
        )}
      </Box>

      {/* Rodapé */}
      <Box
        sx={{
          textAlign: 'center',
          fontSize: '10px',
          mt: 4,
          pb: 2,
          color: '#999',
        }}
      >
        Cardápio digital Cantina Reis
        <br />
        Desenvolvido por <strong>Arpex Technology</strong>
      </Box>
    </Container>
  );
}
