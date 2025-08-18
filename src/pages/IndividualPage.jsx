// src/pages/IndividualPage.jsx  (ou ProdutoIndividual.jsx se preferir)
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControl,
  FormControlLabel,
  Radio,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ResumoPedido from '../componentes/resumoPedido';

const ProdutoIndividual = () => {
  const [quantidade, setQuantidade] = useState(1);
  const [produto, setProduto] = useState(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState('pequeno');
  const [guarnicoesSelecionadas, setGuarnicoesSelecionadas] = useState([]);
  const [observacao, setObservacao] = useState('');
  const [quantidadeSacola, setQuantidadeSacola] = useState(0);

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const fetchProduto = async () => {
      try {
        const docRef = doc(db, 'produtos', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduto(docSnap.data());
        }
      } catch (error) {
        console.error('Erro ao buscar produto:', error);
      }
    };

    fetchProduto();

    // inicia quantidade da sacola (corrigido para quantity)
    const sacola = JSON.parse(localStorage.getItem('sacola')) || [];
    const total = sacola.reduce((acc, p) => acc + Number(p.quantity || 0), 0);
    setQuantidadeSacola(total);
  }, [id]);

  if (!produto) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const preco = parseFloat(produto.precos?.[tamanhoSelecionado] || 0);

  const handleSelecionarGuarnicao = (opcao) => {
    if (guarnicoesSelecionadas.includes(opcao)) {
      setGuarnicoesSelecionadas((prev) => prev.filter((g) => g !== opcao));
    } else if (guarnicoesSelecionadas.length < 2) {
      setGuarnicoesSelecionadas((prev) => [...prev, opcao]);
    }
  };

  const handleAdicionarNaSacola = () => {
    const sacola = JSON.parse(localStorage.getItem('sacola')) || [];

    // usa o id da URL, não produto.id
    const existente = sacola.find(
      (p) => p.id === id && p.tamanho === tamanhoSelecionado
    );

    if (existente) {
      existente.quantity += quantidade;
    } else {
      sacola.push({
        id, // 🔑 garante ID do produto
        nome: produto.nome,
        descricao: produto.descricao,
        imagem: produto.imagem,
        tamanho: tamanhoSelecionado,
        precoSelecionado: preco, // ⚡ salva preço atual!
        guarnicoes: guarnicoesSelecionadas,
        observacao: observacao.trim(),
        quantity: quantidade,
      });
    }

    localStorage.setItem('sacola', JSON.stringify(sacola));

    const novaQuantidade = sacola.reduce(
      (acc, p) => acc + Number(p.quantity || 0),
      0
    );
    setQuantidadeSacola(novaQuantidade);

    const resumoPedido = document.getElementById('resumoPedido');
    if (resumoPedido) resumoPedido.style.bottom = '0';
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 0, sm: 2, md: 3 },
        py: { xs: 0, md: 4 },
        bgcolor: '#F5F5F5',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', md: 1100 },
          mx: 'auto',
          bgcolor: '#FFF',
          borderRadius: { xs: 0, md: 2 },
          overflow: 'hidden',
          boxShadow: { xs: 'none', md: '0 2px 12px rgba(0,0,0,0.06)' },
        }}
      >
        {/* Grid responsivo: imagem à esquerda, detalhes à direita no desktop */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
          }}
        >
          {/* Imagem */}
          <Box sx={{ position: 'relative' }}>
            <Box
              component="img"
              src={produto.imagem}
              alt={produto.nome}
              sx={{
                width: '100%',
                height: { xs: 260, md: '100%' },
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 2,
                bgcolor: 'rgba(0,0,0,.45)',
                '&:hover': { bgcolor: 'rgba(0,0,0,.6)' },
              }}
              aria-label="Fechar"
            >
              <CloseIcon sx={{ color: '#fff' }} />
            </IconButton>
          </Box>

          {/* Detalhes */}
          <Box sx={{ p: { xs: 2, md: 3 }, pb: { xs: 14, md: 16 }, textAlign:'left' }}>
            <Typography
              fontSize={{ xs: 24, md: 26 }}
              fontWeight={600}
              sx={{ mb: 0.5 }}
            >
              {produto.nome}
            </Typography>
            <Typography
              color="text.secondary"
              fontSize={{ xs: 16, md: 15 }}
              fontWeight={300}
              sx={{ mb: 1.5 }}
            >
              {produto.descricao}
            </Typography>

            <Typography fontWeight={600} fontSize={20} sx={{ mb: 2 }}>
              Valor:{' '}
              <span style={{ color: '#111' }}>
                {preco.toFixed(2).replace('.', ',')}
              </span>
            </Typography>

            {/* Tamanho */}
            <Accordion
              disableGutters
              sx={{ boxShadow: 'none', borderTop: '2px solid #D9D9D9'}}
            >
              <AccordionSummary sx={{padding:0}} expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography fontWeight={600} fontSize={16}>Escolha uma opção</Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: '#FF9F0A',
                    px: 2,
                    py:'3px',
                    borderRadius: 1,
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'black',
                    height: 'fit-content',
                  }}
                >
                  Obrigatório
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{padding:0,}}>
                <FormControl>
                  {Object.entries(produto.precos || {}).map(([key, value]) => (
                    <FormControlLabel
                      key={key}
                      value={key}
                      control={
                        <Radio
                          checked={tamanhoSelecionado === key}
                          onChange={(e) => setTamanhoSelecionado(e.target.value)}
                          sx={{
                            color: '#F75724',
                            '&.Mui-checked': { color: '#F75724' },
                          }}
                        />
                      }
                      label={`${key.charAt(0).toUpperCase() + key.slice(1)} - R$ ${parseFloat(
                        value
                      )
                        .toFixed(2)
                        .replace('.', ',')}`}
                      sx={{ mr: 0.5 }}
                    />
                  ))}
                </FormControl>
              </AccordionDetails>
            </Accordion>

            {/* Guarnições (até 2) */}
            <Accordion disableGutters sx={{ boxShadow: 'none' }}>
              <AccordionSummary sx={{padding:0,}} expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography fontWeight="bold">Guarnições</Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    Selecione até 2 opções
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{padding:0,}}>
                {(produto.guarnicoes || []).map((opcao, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Radio
                        checked={guarnicoesSelecionadas.includes(opcao)}
                        onChange={() => handleSelecionarGuarnicao(opcao)}
                        sx={{
                          color: '#F75724',
                          '&.Mui-checked': { color: '#F75724' },
                        }}
                      />
                    }
                    label={opcao}
                    sx={{ mr: 1 }}
                  />
                ))}
              </AccordionDetails>
            </Accordion>

            {/* Observações */}
            <Accordion disableGutters sx={{ boxShadow: 'none' }}>
              <AccordionSummary sx={{padding:0,}} expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight="bold">Observações</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{padding:0,}}>
                <TextField
                  fullWidth
                  multiline
                  placeholder="Escreva aqui sua observação..."
                  variant="outlined"
                  size="small"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </AccordionDetails>
            </Accordion>

            {/* Ações */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 3,
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                  px: 1,
                  height: 40,
                }}
              >
                <IconButton
                  onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                  sx={{ color: '#707070', width: 30, height: 30, p: 0 }}
                  aria-label="Diminuir"
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ mx: 1.5, fontWeight: 600, fontSize: 16 }}>
                  {quantidade}
                </Typography>
                <IconButton
                  onClick={() => setQuantidade(quantidade + 1)}
                  sx={{ color: '#F75724', width: 30, height: 30, p: 0 }}
                  aria-label="Aumentar"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>

              <Button
                variant="contained"
                onClick={handleAdicionarNaSacola}
                sx={{
                  backgroundColor: '#F75724',
                  color: 'white',
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: { xs: 3, md: 4 },
                  py: 1,
                  fontWeight: 600,
                  fontSize: '14px',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                  '&:hover': { backgroundColor: '#e04d1c' },
                }}
              >
                Adicionar {`${(preco * quantidade).toFixed(2).replace('.', ',')}`}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Respiro inferior para não cobrir conteúdo pelo ResumoPedido fixo */}
      <Box sx={{ height: { xs: 0, md: 0 } }} />

      <ResumoPedido quantidade={quantidadeSacola} />
    </Container>
  );
};

export default ProdutoIndividual;
