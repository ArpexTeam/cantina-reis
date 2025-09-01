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
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useNavigate } from 'react-router-dom';

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, runTransaction } from 'firebase/firestore';

// === API (centralizada) ===
import { CHECKOUT_URL } from '../config/api';

// helpers
const toCents = (v) => {
  if (v == null) return 0;
  if (typeof v === 'string') {
    const s = v.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  }
  if (typeof v === 'number') {
    return Number.isInteger(v) && v >= 100 ? v : Math.round(v * 100);
  }
  return 0;
};

// ========= GERADOR DE NÚMERO DE PEDIDO (sequencial diário até 4 dígitos) ==========
function getTodayKeySP() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()); // "YYYY-MM-DD"
}

async function getNextDailyOrderNumber() {
  const todayKey = getTodayKeySP();
  const ref = doc(db, 'orderCounters', todayKey);
  let nextNumber;

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      transaction.set(ref, { current: 1, updatedAt: serverTimestamp() });
      nextNumber = 1;
    } else {
      const current = Number(snap.data()?.current || 0);
      nextNumber = current + 1;
      if (nextNumber > 9999) {
        throw new Error('Limite diário de 9999 pedidos atingido.');
      }
      transaction.update(ref, { current: nextNumber, updatedAt: serverTimestamp() });
    }
  });

  // retorna como string, sem padding (ex.: "1", "12", "345", "9999")
  return String(nextNumber);
}

const mapSacolaToCieloItems = (sacola) =>
  sacola.map((p) => ({
    Name: p?.nome ?? p?.name ?? 'Produto',
    Description: p?.descricao ?? p?.description ?? 'Item',
    UnitPrice: toCents(p?.precoSelecionado ?? p?.preco ?? 0),
    Quantity: Number(p?.quantity ?? p?.quantidade ?? 1),
    Type: 'Asset',
    Sku: String(p?.id ?? p?.sku ?? 'SKU'),
    Weight: Number(p?.peso ?? 0),
  }));

const getCheckoutUrl = (resData) =>
  resData?.CheckoutUrl ||
  resData?.checkoutUrl ||
  resData?.Settings?.CheckoutUrl ||
  resData?.settings?.checkoutUrl;

export default function AgendamentoPage() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [modoPagamento, setModoPagamento] = useState('No caixa'); // "No caixa" | "Online"

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSalvarAgendamento = async () => {
    try {
      if (loading) return;
      setLoading(true);

      const sacola = JSON.parse(localStorage.getItem('sacola') || '[]');
      const itens = sacola.map((item) => ({
        id: item.id || '',
        nome: item.nome || '',
        quantidade: Number(item.quantity || 1),
        preco: Number(item.precoSelecionado ?? item.preco ?? 0),
        tamanho: item.tamanhoSelecionado ?? item.tamanho ?? '',
        guarnicoes: Array.isArray(item.guarnicoes) ? item.guarnicoes : [],
        observacao: item.observacao || '',
      }));
      const total = itens.reduce((acc, p) => acc + Number(p.preco) * Number(p.quantidade), 0);

      if (!nome || !telefone || !dataHora) {
        alert('Preencha todos os campos obrigatórios!');
        setLoading(false);
        return;
      }

      // número de pedido sequencial diário (1..9999, pode ter menos de 4 dígitos)
      const orderNumber = await getNextDailyOrderNumber();
      const [dataAgendamento, horaAgendamento] = dataHora.split('T');

      if (modoPagamento === 'No caixa') {
        // cria o pedido pendente agora (sem Cielo)
        await addDoc(collection(db, 'pedidos'), {
          createdAt: serverTimestamp(),
          itens,
          status: 'pendente',
          tipoServico: 'Agendamento',
          total,
          nome,
          telefone,
          dataAgendamento,
          horaAgendamento,
          observacoes: mensagem,
          pagamento: {
            provedor: 'offline',
            orderNumber,
          },
        });

        localStorage.removeItem('sacola');
        navigate(`/numero/${orderNumber}`);
        return;
      }

      // === Online (Cielo) ===
      await addDoc(collection(db, 'checkoutIntents'), {
        createdAt: serverTimestamp(),
        orderNumber,
        itens,
        total,
        status: 'iniciado',
        tipoServico: 'Agendamento',
        agendamento: { dataAgendamento, horaAgendamento },
        cliente: { nome, telefone, observacoes: mensagem },
      });

      const payload = {
        OrderNumber: orderNumber,
        SoftDescriptor: 'CantinaReis',
        Cart: {
          Discount: { Type: 'Percent', Value: 0 },
          Items: mapSacolaToCieloItems(sacola),
        },
        Shipping: { Type: 'WithoutShipping', Price: 0 },
        Customer: {
          FullName: nome || 'Cliente',
          Phone: telefone || '',
          Email: 'no-reply@cantinareis.com.br',
          Identity: '00000000000',
        },
      };

      if (payload.Cart.Items.some((i) => !i.UnitPrice || i.UnitPrice < 1)) {
        console.table(
          payload.Cart.Items.map((i) => ({
            Name: i.Name,
            UnitPrice: i.UnitPrice,
            Quantity: i.Quantity,
          }))
        );
        throw new Error('Algum item está sem preço válido.');
      }

      const res = await fetch(CHECKOUT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text().catch(() => '');
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
      if (res.status !== 200 && res.status !== 201) {
        throw new Error(`Checkout falhou (${res.status}). ${text || ''}`);
      }

      const checkoutUrl = getCheckoutUrl(data);
      if (!checkoutUrl) throw new Error('CheckoutUrl não retornada pelo backend/Cielo.');

      localStorage.removeItem('sacola');
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Erro ao salvar/agendar:', error);
      alert(error.message || 'Erro ao salvar pedido. Tente novamente.');
    } finally {
      setLoading(false);
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
      {/* Cabeçalho */}
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
        <Typography fontWeight="bold" variant="subtitle1" sx={{ fontSize: { xs: 16, md: 18 } }}>
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
            {/* Nome e Telefone */}
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
              <Typography sx={{ mb: 0.5, fontSize: 14 }}>Selecione data e horário</Typography>
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

            {/* Observações */}
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

            {/* Seletor de pagamento */}
            <Grid item xs={12}>
              <Typography sx={{ mb: 1, fontSize: 14, fontWeight: 600 }}>
                Como deseja pagar?
              </Typography>
              <Stack direction="row" spacing={1}>
                {['No caixa', 'Online'].map((opt) => (
                  <Button
                    key={opt}
                    variant={modoPagamento === opt ? 'contained' : 'outlined'}
                    onClick={() => setModoPagamento(opt)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 1,
                      bgcolor: modoPagamento === opt ? '#F75724' : '#fff',
                      color: modoPagamento === opt ? '#fff' : '#F75724',
                      borderColor: '#F75724',
                      '&:hover': {
                        bgcolor: modoPagamento === opt ? '#e6491c' : '#FFF1EB',
                        borderColor: '#e6491c',
                      },
                    }}
                  >
                    {opt}
                  </Button>
                ))}
              </Stack>
            </Grid>

            {/* Botão confirmar */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                <Button
                  variant="contained"
                  onClick={handleSalvarAgendamento}
                  disabled={loading}
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
                  {loading ? 'Processando...' : 'CONFIRMAR AGENDAMENTO'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Box sx={{ height: { xs: 16, md: 0 } }} />
    </Container>
  );
}
