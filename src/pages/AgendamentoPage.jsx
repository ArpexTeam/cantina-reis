import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useNavigate } from 'react-router-dom';

import { db } from '../firebase'; // ✅ ajuste se necessário
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
      navigate('/cardapio'); // redirecione para onde quiser
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      alert('Erro ao salvar pedido. Tente novamente.');
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        p: 0,
        bgcolor: '#F5F5F5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* Topo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          bgcolor: '#FFF',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <IconButton size="small" onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography fontWeight="bold">Agendar</Typography>
        <IconButton size="small" onClick={() => navigate(-1)}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Formulário */}
      <Box sx={{ p: 2 }}>
        <Typography sx={{ mb: 0.5, fontSize: 14 }}>Nome</Typography>
        <TextField
          fullWidth
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonOutlineIcon sx={{ fontSize: 18, color: '#6B7280' }} />
              </InputAdornment>
            ),
          }}
        />

        <Typography sx={{ mb: 0.5, fontSize: 14 }}>Telefone</Typography>
        <TextField
          fullWidth
          placeholder="(19) 90000-2222"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneAndroidIcon sx={{ fontSize: 18, color: '#6B7280' }} />
              </InputAdornment>
            ),
          }}
        />

        <Typography sx={{ mb: 0.5, fontSize: 14 }}>Selecione data e horário</Typography>
        <TextField
          fullWidth
          type="datetime-local"
          value={dataHora}
          onChange={(e) => setDataHora(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarTodayIcon sx={{ fontSize: 18, color: '#6B7280' }} />
              </InputAdornment>
            ),
          }}
        />

        <Typography sx={{ mb: 0.5, fontSize: 14 }}>Envie uma mensagem</Typography>
        <TextField
          fullWidth
          placeholder="Deixe uma observação..."
          multiline
          minRows={4}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          sx={{ mb: 2 }}
        />
      </Box>

      {/* Botão */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSalvarAgendamento}
          sx={{
            bgcolor: '#F75724',
            color: '#FFF',
            textTransform: 'none',
            borderRadius: '5px',
            fontWeight: 'bold',
            py: 1.5,
            '&:hover': {
              bgcolor: '#d44b1e',
            },
          }}
        >
          CONFIRMAR AGENDAMENTO
        </Button>
      </Box>
    </Container>
  );
}
