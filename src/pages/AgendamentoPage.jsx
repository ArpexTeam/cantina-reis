// src/pages/AgendamentoPage.jsx
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useNavigate } from 'react-router-dom';

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AgendamentoPage() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [dataHora, setDataHora] = useState('');
  const navigate = useNavigate();

  const handleSalvarAgendamento = async () => {
    try {
      const sacola = JSON.parse(localStorage.getItem('sacola')) || [];

      const itens = sacola.map((item) => ({
        produtoId: item.id || '',
        nome: item.nome || '',
        quantidade: item.quantity || 1,
        preco: item.precoSelecionado ?? item.preco ?? 0,
        tamanho: item.tamanhoSelecionado ?? item.tamanho ?? '',
        guarnicoes: Array.isArray(item.guarnicoes) ? item.guarnicoes : [],
        observacoes: item.observacao || '',
      }));

      const total = itens.reduce((acc, p) => acc + p.preco * p.quantidade, 0);

      if (!nome || !telefone || !dataHora) {
        alert('Preencha todos os campos obrigatórios!');
        return;
      }

      await addDoc(collection(db, 'pedidos'), {
        createdAt: serverTimestamp(),
        itens,
        status: 'pendente',
        tipoServico: 'Agendamento',
        total,
        nome,
        telefone,
        dataAgendamento: dataHora.split('T')[0],
        horaAgendamento: dataHora.split('T')[1],
        observacoes: mensagem,
      });

      alert('Pedido agendado com sucesso!');
      localStorage.removeItem('sacola');
      navigate('/cardapio');
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      alert('Erro ao salvar pedido. Tente novamente.');
    }
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
        bgcolor: { xs: '#F5F5F5', md: '#F5F5F5' },
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* Cabeçalho (mobile-first) */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          bgcolor: '#FFF',
          borderBottom: { xs: '1px solid #E5E7EB', md: 'none' },
          borderRadius: { xs: 0, md: 2 },
          mb: { xs: 0, md: 2 },
        }}
      >
        <IconButton size="small" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowBackIcon />
        </IconButton>
        <Typography
          fontWeight="bold"
          variant="subtitle1"
          sx={{ fontSize: { xs: 16, md: 18 } }}
        >
          Agendar
        </Typography>
        <IconButton size="small" onClick={() => navigate(-1)} aria-label="Fechar">
          <CloseIcon />
        </IconButton>
      </Paper>

      {/* Conteúdo */}
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr' },
          gap: { xs: 0, md: 3 },
          alignItems: 'start',
          justifyItems: 'center',
        }}
      >
        {/* Card do formulário */}
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', md: 900 },
            bgcolor: '#FFF',
            borderRadius: { xs: 0, md: 2 },
            p: { xs: 2, md: 3 },
            boxShadow: { xs: 'none', md: '0 2px 12px rgba(0,0,0,0.06)' },
          }}
        >
          <Grid container spacing={2}>
            {/* Nome e Telefone lado a lado no desktop */}
            <Grid item xs={12} md={6}>
              <Typography sx={{ mb: 0.5, fontSize: 14 }}>Nome</Typography>
              <TextField
                fullWidth
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ mb: 0.5, fontSize: 14 }}>Telefone</Typography>
              <TextField
                fullWidth
                type="tel"
                placeholder="(19) 90000-2222"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneAndroidIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Data/Hora */}
            <Grid item xs={12} md={6}>
              <Typography sx={{ mb: 0.5, fontSize: 14 }}>
                Selecione data e horário
              </Typography>
              <TextField
                fullWidth
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Mensagem (ocupa largura toda) */}
            <Grid item xs={12}>
              <Typography sx={{ mb: 0.5, fontSize: 14 }}>Envie uma mensagem</Typography>
              <TextField
                fullWidth
                placeholder="Deixe uma observação..."
                multiline
                minRows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
              />
            </Grid>

            {/* Botão: full no mobile, alinhado à direita no desktop */}
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'stretch', md: 'flex-end' },
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleSalvarAgendamento}
                  sx={{
                    width: { xs: '100%', md: 'auto' },
                    px: { md: 3 },
                    bgcolor: '#F75724',
                    color: '#FFF',
                    textTransform: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    py: 1.5,
                    '&:hover': { bgcolor: '#d44b1e' },
                  }}
                >
                  CONFIRMAR AGENDAMENTO
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Espaço inferior no mobile para evitar conflito com elementos fixos */}
      <Box sx={{ height: { xs: 16, md: 0 } }} />
    </Container>
  );
}
