// src/pages/IndividualPage.jsx  (ProdutoIndividual.jsx se preferir)
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
  Checkbox,
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


import cantinaLogo from '../img/ChatGPT Image 23 de abr. de 2025, 20_03_44 (1) 2.svg';

const ProdutoIndividual = () => {
  const [quantidade, setQuantidade] = useState(1);
  const [produto, setProduto] = useState(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState('pequeno');
  const [guarnicoesSelecionadas, setGuarnicoesSelecionadas] = useState([]);
  const [observacao, setObservacao] = useState('');
  const [quantidadeSacola, setQuantidadeSacola] = useState(0);

  // fallback visual da imagem
  const [showFallback, setShowFallback] = useState(false);
  const fallbackGradient = 'linear-gradient(135deg, #FF6B2C 0%, #111827 100%)';

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
          const p = docSnap.data() || {};
          const cfg = p.config || {};
          const precos = p.precos || {};
          const keys = Object.keys(precos || {});
          const hasSizes =
            cfg.habilitarTamanhos ?? (Array.isArray(keys) && keys.length > 1);

          if (hasSizes) {
            const prefer = keys.includes('pequeno') ? 'pequeno' : keys[0];
            setTamanhoSelecionado(prefer);
          } else {
            setTamanhoSelecionado('pequeno'); // preço único
          }

          setGuarnicoesSelecionadas([]);

          setProduto({
            ...p,
            config: {
              habilitarTamanhos: !!(cfg.habilitarTamanhos ?? (keys.length > 1)),
              habilitarGuarnicoes: !!(
                cfg.habilitarGuarnicoes ??
                (Array.isArray(p.guarnicoes) && p.guarnicoes.length > 0)
              ),
              maxGuarnicoes: Number(cfg.maxGuarnicoes ?? 2),
            },
          });

          // define se já começa no fallback (sem imagem no produto)
          setShowFallback(!p.imagem);
        }
      } catch (error) {
        console.error('Erro ao buscar produto:', error);
      }
    };

    fetchProduto();

    // inicia quantidade da sacola (usando 'quantity')
    const sacola = JSON.parse(localStorage.getItem('sacola') || '[]');
    const total = sacola.reduce((acc, p) => acc + Number(p.quantity || 0), 0);
    setQuantidadeSacola(total);
  }, [id]);

  // quando a URL de imagem mudar, recalcula fallback
  useEffect(() => {
    if (!produto) return;
    setShowFallback(!produto.imagem);
  }, [produto?.imagem]);

  if (!produto) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasSizes = !!produto.config?.habilitarTamanhos;
  const hasAddons = !!produto.config?.habilitarGuarnicoes;
  const maxGuarnicoes = Number(produto.config?.maxGuarnicoes ?? 2);

  // helper: string BR ("R$ 1.234,56", "12,00") -> number
  const toNumberBR = (v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const s = v.replace(/R\$\s?/i, '').replace(/\./g, '').replace(',', '.');
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  // Preço atual (dinâmico) em reais
  const preco = toNumberBR(
    hasSizes
      ? produto.precos?.[tamanhoSelecionado] ?? 0
      : produto.precos?.pequeno ?? 0
  );
  const precoValido = preco > 0;

  const sizeEntries = Object.entries(produto.precos || {});
  const orderedSizeKeys = ['pequeno', 'medio', 'executivo'].filter(
    (k) => (produto.precos || {})[k] !== undefined
  );
  const otherKeys = sizeEntries
    .map(([k]) => k)
    .filter((k) => !orderedSizeKeys.includes(k));
  const sizeKeys = [...orderedSizeKeys, ...otherKeys];

  const handleSelecionarGuarnicao = (opcao) => {
    const ja = guarnicoesSelecionadas.includes(opcao);
    if (ja) {
      setGuarnicoesSelecionadas((prev) => prev.filter((g) => g !== opcao));
    } else {
      if (maxGuarnicoes > 0 && guarnicoesSelecionadas.length >= maxGuarnicoes) {
        return;
      }
      setGuarnicoesSelecionadas((prev) => [...prev, opcao]);
    }
  };

  const handleAdicionarNaSacola = () => {
    if (!precoValido) {
      alert('Este item está indisponível no momento.');
      return;
    }

    const sacola = JSON.parse(localStorage.getItem('sacola') || '[]');

    const existente = sacola.find(
      (p) =>
        p.id === id &&
        p.tamanho === (hasSizes ? tamanhoSelecionado : 'pequeno')
    );

    const itemBase = {
      id,
      nome: produto.nome,
      descricao: produto.descricao,
      imagem: produto.imagem,
      tamanho: hasSizes ? tamanhoSelecionado : 'pequeno',
      precoSelecionado: preco,
      guarnicoes: guarnicoesSelecionadas,
      observacao: observacao.trim(),
    };

    if (existente) {
      existente.quantity += quantidade;
      existente.precoSelecionado = preco;
      existente.guarnicoes = guarnicoesSelecionadas;
      existente.observacao = observacao.trim();
    } else {
      sacola.push({
        ...itemBase,
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
        {/* Grid responsivo */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
          }}
        >
          {/* Imagem com Fallback */}
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                width: '100%',
                height: { xs: 260, md: '100%' },
                minHeight: { md: 360 }, // garante uma área boa no desktop
                background: showFallback ? fallbackGradient : '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {!showFallback ? (
                <img
                  src={produto.imagem}
                  alt={produto.nome}
                  onError={() => setShowFallback(true)}
                  loading="lazy"
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : (
                <img
                  src={cantinaLogo}
                  alt="Logo da cantina"
                  draggable={false}
                  style={{
                    maxWidth: '55%',
                    maxHeight: '55%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))',
                  }}
                />
              )}
            </Box>

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
          <Box sx={{ p: { xs: 2, md: 3 }, pb: { xs: 14, md: 16 }, textAlign: 'left' }}>
            <Typography fontSize={{ xs: 24, md: 26 }} fontWeight={600} sx={{ mb: 0.5 }}>
              {produto.nome}
            </Typography>
            <Typography color="text.secondary" fontSize={{ xs: 16, md: 15 }} fontWeight={300} sx={{ mb: 1.5 }}>
              {produto.descricao}
            </Typography>

            {/* preço só aparece se válido */}
            {precoValido && (
              <Typography fontWeight={600} fontSize={20} sx={{ mb: 2 }}>
                Valor:{' '}
                <span style={{ color: '#111' }}>
                  {preco.toFixed(2).replace('.', ',')}
                </span>
              </Typography>
            )}

            {/* Tamanhos (só quando habilitado) */}
            {hasSizes && sizeKeys.length > 0 && (
              <Accordion disableGutters sx={{ boxShadow: 'none', borderTop: '2px solid #D9D9D9' }}>
                <AccordionSummary sx={{ padding: 0 }} expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography fontWeight={600} fontSize={16}>Escolha uma opção</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: 0 }}>
                  <FormControl>
                    {sizeKeys.map((key) => {
                      const valor = toNumberBR(produto.precos?.[key]);
                      if (!valor || valor <= 0) return null; // não renderiza tamanho sem preço
                      const label =
                        key.charAt(0).toUpperCase() + key.slice(1).replace('medio', 'médio');
                      return (
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
                          label={`${label} - R$ ${valor.toFixed(2).replace('.', ',')}`}
                          sx={{ mr: 0.5 }}
                        />
                      );
                    })}
                  </FormControl>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Guarnições (dinâmico) */}
            {hasAddons && Array.isArray(produto.guarnicoes) && produto.guarnicoes.length > 0 && (
              <Accordion disableGutters sx={{ boxShadow: 'none' }}>
                <AccordionSummary sx={{ padding: 0 }} expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography fontWeight="bold">Guarnições</Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {`Selecione até ${maxGuarnicoes} opção(ões)`}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: 0 }}>
                  {(produto.guarnicoes || []).map((opcao, index) => (
                    <FormControlLabel
                      key={index}
                      control={
                        <Checkbox
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
            )}

            {/* Observações */}
            <Accordion disableGutters sx={{ boxShadow: 'none' }}>
              <AccordionSummary sx={{ padding: 0 }} expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight="bold">Observações</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 0 }}>
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
                disabled={!precoValido}
                sx={{
                  backgroundColor: precoValido ? '#F75724' : '#9CA3AF',
                  color: 'white',
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: { xs: 3, md: 4 },
                  py: 1,
                  fontWeight: 600,
                  fontSize: '14px',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                  '&:hover': { backgroundColor: precoValido ? '#e04d1c' : '#9CA3AF' },
                }}
              >
                {precoValido
                  ? `Adicionar R$ ${(preco * quantidade).toFixed(2).replace('.', ',')}`
                  : 'Indisponível'}
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
