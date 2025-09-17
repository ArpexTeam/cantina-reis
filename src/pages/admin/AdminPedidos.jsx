import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Avatar, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Button, TextField, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  RadioGroup, Radio, FormControlLabel, InputAdornment, MenuItem
} from '@mui/material';
import Sidebar from '../../componentes/admin/sidebar';
import {
  collection, query, where, Timestamp, updateDoc, doc, runTransaction, orderBy, onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase';
import logo from '../../img/ChatGPT Image 23 de abr. de 2025, 20_03_44 (1) 2.svg';
import SearchIcon from '@mui/icons-material/Search';
import { format } from 'date-fns';
import NovoPedidoModal from '../../componentes/admin/NovoPedidoModal';

/* =========================
   QZ Tray helpers
   ========================= */
const QZ_CDNS = [
  'https://cdnjs.cloudflare.com/ajax/libs/qz-tray/2.1.0/qz-tray.js',
  '/qz-tray.js'
];

function injectScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-qz-src="${src}"]`) ||
        document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-qz-src', src);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Falha ao carregar script: ${src}`));
    document.head.appendChild(s);
  });
}
async function waitForQZ(timeoutMs = 2500) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (window.qz) return window.qz;
    await new Promise(r => setTimeout(r, 50));
  }
  throw new Error('QZ Tray não ficou disponível em window.qz');
}
async function loadQZ() {
  if (window.qz) return window.qz;
  let lastErr = null;
  for (const src of QZ_CDNS) {
    try {
      await injectScript(src);
      const qz = await waitForQZ(2500);
      return qz;
    } catch (e) {
      lastErr = e;
      console.warn('[QZ] Tentativa falhou em', src, e?.message || e);
    }
  }
  throw new Error(`QZ Tray não carregou. Último erro: ${lastErr?.message || lastErr}`);
}

/* =========================
   Helpers
   ========================= */
const toNumberBR = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const s = v.replace(/R\$\s?/i, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};
const formatBRL = (n) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;
const normalize = (s) =>
  (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/* =========================
   Diálogo de Pagamento
   ========================= */
function PagamentoDialog({ open, onClose, onConfirm, pedido }) {
  const [tipo, setTipo] = useState('dinheiro');
  const [valorRecebido, setValorRecebido] = useState('');

  useEffect(() => {
    if (open) {
      setTipo('dinheiro');
      setValorRecebido('');
    }
  }, [open]);

  if (!pedido) return null;

  const total = Number(pedido.total ?? 0);
  const recebidoNum = tipo === 'dinheiro' ? toNumberBR(valorRecebido) : 0;
  const troco = tipo === 'dinheiro' ? Math.max(0, recebidoNum - total) : 0;
  const falta = tipo === 'dinheiro' ? Math.max(0, total - recebidoNum) : 0;
  const podeConfirmar = !(tipo === 'dinheiro' && recebidoNum < total);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Forma de pagamento</DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ mb: 1 }}>
          Total do pedido: <b>{formatBRL(total)}</b>
        </Typography>

        <RadioGroup row value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <FormControlLabel value="dinheiro" control={<Radio />} label="Dinheiro" />
          <FormControlLabel value="pix" control={<Radio />} label="PIX" />
          <FormControlLabel value="cartao" control={<Radio />} label="Cartão" />
          <FormControlLabel value="outro" control={<Radio />} label="Outro" />
        </RadioGroup>

        {tipo === 'dinheiro' && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }} alignItems="center">
            <TextField
              label="Valor recebido"
              value={valorRecebido}
              onChange={(e) => setValorRecebido(e.target.value)}
              placeholder="0,00"
              inputProps={{ inputMode: 'decimal' }}
              sx={{ maxWidth: 220 }}
              InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
            />
            {valorRecebido !== '' && (
              <>
                {falta > 0 ? (
                  <Typography sx={{ color: '#b91c1c', fontWeight: 700 }}>
                    Falta: {formatBRL(falta)}
                  </Typography>
                ) : (
                  <Typography sx={{ color: '#047857', fontWeight: 700 }}>
                    Troco: {formatBRL(troco)}
                  </Typography>
                )}
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => onConfirm({ tipo, valorRecebido: recebidoNum, troco })}
          disabled={!podeConfirmar}
          sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [novoOpen, setNovoOpen] = useState(false);

  // QZ
  const [qzConnected, setQzConnected] = useState(false);
  const [printers, setPrinters] = useState([]);
  const [printerOverride, setPrinterOverride] = useState(localStorage.getItem('printerOverride') || '');
  const [printerGeral, setPrinterGeral] = useState(localStorage.getItem('printerGeral') || '');
  const [printerAlmoco, setPrinterAlmoco] = useState(localStorage.getItem('printerAlmoco') || '');
  const connectingRef = useRef(false);

  // Mapa idProduto -> categoria
  const produtosMapRef = useRef(new Map());

  // Pagamento
  const [payOpen, setPayOpen] = useState(false);
  const [payPedido, setPayPedido] = useState(null);

  // Cores status
  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo':
      case 'aprovado':
        return '#DEF7EC';
      case 'cancelado':
        return '#FDE8E8';
      case 'pendente':
        return '#FDF6B2';
      default:
        return '#E0E0E0';
    }
  };
  const getStatusFontColor = (status) => {
    switch (status) {
      case 'ativo':
      case 'aprovado':
        return '#03543F';
      case 'cancelado':
        return '#9B1C1C';
      case 'pendente':
        return '#723B13';
      default:
        return '#6B7280';
    }
  };

  // Hoje (limites) - local
  const makeTodayBounds = () => {
    const now = new Date();
    const hoje0 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const amanha0 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return {
      hoje0TS: Timestamp.fromDate(hoje0),
      amanha0TS: Timestamp.fromDate(amanha0),
    };
  };

  /* =========================
     LIVE: Pedidos de HOJE
     ========================= */
  const [dayKey, setDayKey] = useState(0); // força re-subscribe na virada do dia

  const subscribePedidosHoje = useCallback(() => {
    const { hoje0TS, amanha0TS } = makeTodayBounds();
    const qy = query(
      collection(db, 'pedidos'),
      where('createdAt', '>=', hoje0TS),
      where('createdAt', '<', amanha0TS),
      orderBy('createdAt', 'desc')
    );

    // assinatura em tempo real
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPedidos(rows);
        // sempre que chega atualização, volta pra página 1 para ver pedidos novos
        setCurrentPage(1);
      },
      (err) => {
        console.error('onSnapshot(pedidos) erro:', err);
      }
    );
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribePedidosHoje();
    return () => unsub && unsub();
  }, [subscribePedidosHoje, dayKey]);

  // Reassina na virada do dia (00:00 local)
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0
    );
    const ms = Math.max(1000, nextMidnight.getTime() - now.getTime() + 50);
    const to = setTimeout(() => setDayKey((k) => k + 1), ms);
    return () => clearTimeout(to);
  }, [dayKey]);

  /* =========================
     LIVE: mapa produtos -> categoria
     ========================= */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'produtos'),
      (snap) => {
        const map = new Map();
        snap.docs.forEach((d) => {
          const data = d.data() || {};
          map.set(d.id, (data.categoria || '').toString());
        });
        produtosMapRef.current = map;
      },
      (err) => console.warn('onSnapshot(produtos) erro:', err?.message || err)
    );
    return () => unsub && unsub();
  }, []);

  /* =========================
     QZ: conectar/listar
     ========================= */
  const connectQZ = async () => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    try {
      const qz = await loadQZ();
      if (!qz.websocket.isActive()) await qz.websocket.connect();
      setQzConnected(qz.websocket.isActive());

      const list = await qz.printers.find();
      setPrinters(list);

      const preferElgin = list.find(p => /elgin/i.test(p)) || list[0] || '';
      const preferGeneric = list.find(p => /^generic\s*\/\s*text\s*only$/i.test(p)) || '';

      const ensure = (saved, preferred, fallback) =>
        list.includes(saved) ? saved : (preferred || fallback || '');

      setPrinterGeral(prev => {
        const next = ensure(prev, preferElgin, list[0]);
        if (next) localStorage.setItem('printerGeral', next);
        return next;
      });

      setPrinterAlmoco(prev => {
        const next = ensure(prev, preferGeneric, preferElgin || list[0]);
        if (next) localStorage.setItem('printerAlmoco', next);
        return next;
      });

      setPrinterOverride(prev => {
        const next = prev && list.includes(prev) ? prev : '';
        if (next !== prev) localStorage.setItem('printerOverride', next);
        return next;
      });
    } catch (e) {
      console.error('Falha QZ:', e);
      setQzConnected(false);
      alert('Não consegui conectar ao QZ Tray. Deixe o app aberto na bandeja do sistema.');
    } finally {
      connectingRef.current = false;
    }
  };

  // ----- Escolha de impressora com prioridade
  const choosePrinterForPedido = (pedido) => {
    if (printerOverride) return printerOverride;

    const hasAlmoco = (pedido.itens || []).some((it) => {
      const catItem = (it.categoria || it.category || '').toString();
      const catByMap = produtosMapRef.current.get(it.id) || '';
      const cat = normalize(catItem || catByMap);
      return cat === 'almoco';
    });

    if (hasAlmoco && printerAlmoco) return printerAlmoco;
    if (!hasAlmoco && printerGeral) return printerGeral;
    return printerGeral || printerAlmoco || printers[0] || null;
  };

  // imprime um pedido
  const printPedido = async (pedido) => {
    try {
      const qz = await loadQZ();
      if (!qz.websocket.isActive()) await qz.websocket.connect();

      const chosen = choosePrinterForPedido(pedido);
      if (!chosen) {
        alert('Nenhuma impressora definida. Conecte ao QZ e selecione as impressoras.');
        return;
      }
      const list = await qz.printers.find();
      if (!list.includes(chosen)) {
        setPrinters(list);
        alert(`Impressora "${chosen}" não disponível. Selecione outra.`);
        return;
      }

      const cfg = qz.configs.create(chosen);

      const orderNumber = pedido.pagamento?.orderNumber || pedido.id;
      const linhas = [];
      linhas.push('*** PEDIDO ***\n');
      linhas.push(`Nº: ${orderNumber}\n`);
      linhas.push(`Cliente: ${pedido.nome || '-'}\n`);
      linhas.push(`Telefone: ${pedido.telefone || '-'}\n`);
      linhas.push('\nITENS:\n');
      (pedido.itens || []).forEach(it => {
        const nome = it.nome || it.Name || 'Item';
        const qtd = Number(it.quantidade ?? it.quantity ?? 1);
        const preco = Number(it.preco ?? it.Price ?? 0);
        linhas.push(`- ${nome}  x${qtd}  R$ ${(qtd * preco).toFixed(2)}\n`);
      });
      linhas.push('\n');
      linhas.push(`TOTAL: R$ ${Number(pedido.total ?? 0).toFixed(2)}\n`);
      linhas.push(`Pagamento: ${pedido.pagamento?.tipo || pedido.pagamento?.metodo || pedido.tipoServico || '-'}\n`);
      if (pedido.pagamento?.tipo === 'dinheiro') {
        const troco = Number(pedido.pagamento?.troco ?? 0);
        if (troco > 0) linhas.push(`Troco: R$ ${troco.toFixed(2)}\n`);
      }
      linhas.push('\nObrigado!\n\n');

      const data = [
        { type: 'raw', format: 'plain', data: linhas.join('') },
        { type: 'raw', format: 'hex', data: '1D5600' } // corte total
      ];

      await qz.print(cfg, data);
    } catch (err) {
      console.error('Erro ao imprimir:', err);
      alert('Erro ao imprimir: ' + (err?.message || err));
    }
  };

  // Aprovação com pagamento
  const handleApproveClick = (pedido) => {
    if (pedido.status !== 'pendente') {
      alert('Este pedido não está pendente.');
      return;
    }
    const isPagarNoCaixa = (pedido.pagamento?.provedor === 'offline') || (pedido.tipoServico === 'No caixa');
    if (!isPagarNoCaixa) {
      const ok = window.confirm('Aprovar este pedido?');
      if (!ok) return;
      approveWithPayment(pedido, { tipo: 'outro' });
      return;
    }
    setPayPedido(pedido);
    setPayOpen(true);
  };

  const approveWithPayment = async (pedido, pagamentoInput) => {
    try {
      const isPendenteOffline =
        pedido.status === 'pendente' &&
        (pedido.pagamento?.provedor === 'offline' || pedido.tipoServico === 'No caixa');

      const pagamentoData = {
        ...(pedido.pagamento || {}),
        provedor: 'offline',
        tipo: pagamentoInput.tipo,
        ...(pagamentoInput.tipo === 'dinheiro'
          ? { valorRecebido: Number(pagamentoInput.valorRecebido || 0), troco: Number(pagamentoInput.troco || 0) }
          : { valorRecebido: null, troco: null })
      };

      if (isPendenteOffline) {
        await runTransaction(db, async (transaction) => {
          const mapa = new Map();
          for (const item of (pedido.itens || [])) {
            const prodId = item.id;
            const qtd = Number(item.quantidade ?? item.quantity ?? 1);
            if (!prodId || !qtd || qtd <= 0) continue;
            mapa.set(prodId, (mapa.get(prodId) || 0) + qtd);
          }

          const prodIds = Array.from(mapa.keys());
          const prodRefs = prodIds.map((id) => doc(db, 'produtos', id));

          const snaps = [];
          for (const r of prodRefs) snaps.push(await transaction.get(r));

          snaps.forEach((snap, idx) => {
            if (!snap.exists()) throw new Error(`Produto ${prodIds[idx]} não encontrado.`);
            const dados = snap.data();
            const estoqueAtual = Number(dados?.estoque ?? 0);
            const qtdNecessaria = mapa.get(prodIds[idx]) || 0;
            if (estoqueAtual < qtdNecessaria) {
              throw new Error(
                `Estoque insuficiente para "${dados?.nome || prodIds[idx]}". ` +
                `Disp.: ${estoqueAtual}, solic.: ${qtdNecessaria}`
              );
            }
          });

          snaps.forEach((snap, idx) => {
            const dados = snap.data();
            const estoqueAtual = Number(dados?.estoque ?? 0);
            const qtdNecessaria = mapa.get(prodIds[idx]) || 0;
            transaction.update(prodRefs[idx], { estoque: estoqueAtual - qtdNecessaria });
          });

          const pedidoRef = doc(db, 'pedidos', pedido.id);
          transaction.update(pedidoRef, { status: 'aprovado', pagamento: pagamentoData });
        });
      } else {
        const pedidoRef = doc(db, 'pedidos', pedido.id);
        await updateDoc(pedidoRef, { status: 'aprovado', pagamento: pagamentoData });
      }

      // não é necessário setPedidos localmente: o onSnapshot atualizará tudo
      setPayOpen(false);
      setPayPedido(null);

      const deveImprimir = window.confirm('Pedido aprovado. Deseja imprimir agora?');
      if (deveImprimir) {
        if (!qzConnected) await connectQZ();
        const atualizado = { ...pedido, status: 'aprovado', pagamento: pagamentoData };
        await printPedido(atualizado);
      }
    } catch (error) {
      console.error('Erro ao aprovar pedido:', error);
      alert(error.message || 'Erro ao aprovar o pedido.');
    }
  };

  const handleStatusChange = async (pedidoId, novoStatus) => {
    try {
      const pedidoRef = doc(db, 'pedidos', pedidoId);
      await updateDoc(pedidoRef, { status: novoStatus });
      // onSnapshot cuidará de refletir a mudança
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert(error.message || 'Erro ao atualizar status do pedido.');
    }
  };

  // Busca/filtra
  const pedidosFiltrados = pedidos.filter((p) => {
    const t = (searchTerm || '').toLowerCase();
    const orderCode = (p.pagamento?.orderNumber || p.id || '').toString().toLowerCase();
    return (
      orderCode.includes(t) ||
      (p.nome || '').toLowerCase().includes(t) ||
      (p.telefone || '').toLowerCase().includes(t) ||
      (p.status || '').toLowerCase().includes(t) ||
      (p.tipoServico || '').toLowerCase().includes(t) ||
      (p.itens || []).some((item) => (item.nome || item.Name || '').toLowerCase().includes(t))
    );
  });

  const totalPages = Math.ceil(pedidosFiltrados.length / itemsPerPage) || 1;
  const pedidosExibidos = pedidosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, bgcolor: '#F8F8F8' }}>
        {/* Header */}
        <Box sx={{
          width: '100%', height: 80, px: 4, backgroundColor: '#000',
          color: '#FFF', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', position: 'absolute', left: 0, zIndex: 10
        }}>
          <Box sx={{ height: 70 }}>
            <img src={logo} alt="Logo" style={{ height: '100%' }} />
          </Box>

          {/* QZ + seletores */}
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="nowrap" sx={{ minWidth: 780 }}>
            <Typography component="span" sx={{ fontSize: 12 }}>
              QZ: {qzConnected ? 'Conectado' : 'Desconectado'}
            </Typography>

            <Button
              onClick={connectQZ}
              size="small"
              sx={{ bgcolor: '#ffffff20', color: '#fff', textTransform: 'none', '&:hover': { bgcolor: '#ffffff30' } }}
            >
              {qzConnected ? 'Atualizar impressoras' : 'Conectar QZ'}
            </Button>

            {/* Impressora Prioritária */}
            <TextField
              select
              size="small"
              label="Impressora (prioritária)"
              value={printerOverride}
              onChange={(e) => {
                setPrinterOverride(e.target.value);
                localStorage.setItem('printerOverride', e.target.value || '');
              }}
              sx={{ minWidth: 220, bgcolor: '#ffffff10', borderRadius: 1 }}
              InputLabelProps={{ sx: { color: '#fff' } }}
              SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 240 } } } }}
              InputProps={{ sx: { color: '#fff' } }}
            >
              <MenuItem value="">(Auto por categoria)</MenuItem>
              {printers.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </TextField>

            {/* Impressora Geral (padrão: Elgin) */}
            <TextField
              select
              size="small"
              label="Impressora Geral"
              value={printerGeral}
              onChange={(e) => {
                setPrinterGeral(e.target.value);
                localStorage.setItem('printerGeral', e.target.value || '');
              }}
              sx={{ minWidth: 200, bgcolor: '#ffffff10', borderRadius: 1 }}
              InputLabelProps={{ sx: { color: '#fff' } }}
              SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 240 } } } }}
              InputProps={{ sx: { color: '#fff' } }}
            >
              {printers.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </TextField>

            {/* Impressora Almoço (padrão: Generic / Text Only) */}
            <TextField
              select
              size="small"
              label="Impressora Almoço"
              value={printerAlmoco}
              onChange={(e) => {
                setPrinterAlmoco(e.target.value);
                localStorage.setItem('printerAlmoco', e.target.value || '');
              }}
              sx={{ minWidth: 200, bgcolor: '#ffffff10', borderRadius: 1 }}
              InputLabelProps={{ sx: { color: '#fff' } }}
              SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 240 } } } }}
              InputProps={{ sx: { color: '#fff' } }}
            >
              {printers.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </TextField>

            <Avatar src="https://via.placeholder.com/150" />
            <Typography component="span">Administrador</Typography>
          </Stack>
        </Box>

        <Box sx={{ p: 4, mt: 10 }}>
          <Typography variant="h6" fontWeight="bold" textAlign="center">
            Pedidos (HOJE)
          </Typography>
          <Box sx={{ borderBottom: '2px solid black', my: 2 }} />

          {/* Barra: busca + novo */}
          <Box sx={{ display: 'flex', mb: 2, justifyContent: 'space-between', gap: 2 }}>
            <TextField
              placeholder="Pesquisar por nº pedido, nome, item, status..."
              size="small"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              sx={{ maxWidth: '40%', bgcolor: '#fff', borderRadius: '6px' }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: '#9CA3AF', mr: 1 }} fontSize="small" />
                ),
                sx: { height: '40px', pl: 1 },
              }}
            />

            <Button
              variant="contained"
              onClick={() => setNovoOpen(true)}
              sx={{
                ml: 'auto',
                bgcolor: '#F75724',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: '#e6491c' },
              }}
            >
              Novo pedido (caixa)
            </Button>
          </Box>

          {/* Tabela */}
          <Paper sx={{ overflow: 'hidden', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Nº PEDIDO</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>NOME</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>TELEFONE</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>ITENS</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>TOTAL</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>DATA</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>AÇÕES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pedidosExibidos.map((pedido) => {
                  const orderNumber = pedido.pagamento?.orderNumber || pedido.id;
                  const aprovado = pedido.status === 'aprovado';

                  return (
                    <TableRow key={pedido.id}>
                      <TableCell sx={{ fontWeight: 700 }}>{orderNumber}</TableCell>
                      <TableCell>{pedido.nome || '-'}</TableCell>
                      <TableCell>{pedido.telefone || '-'}</TableCell>
                      <TableCell>
                        {pedido.itens?.map((item, idx) => (
                          <Box key={idx}>
                            {(item.nome || item.Name || 'item')} x{item.quantidade ?? item.quantity ?? 1}
                          </Box>
                        ))}
                      </TableCell>
                      <TableCell>R$ {(Number(pedido.total ?? 0)).toFixed(2)}</TableCell>
                      <TableCell>
                        <Box sx={{
                          display: 'inline-block',
                          px: 1.5, py: 0.5,
                          borderRadius: '4px',
                          bgcolor: getStatusColor(pedido.status),
                          color: getStatusFontColor(pedido.status),
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {pedido.status}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {pedido.createdAt
                          ? format(pedido.createdAt.toDate(), 'dd/MM/yyyy HH:mm')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleApproveClick(pedido)}
                          size="small"
                          variant="contained"
                          sx={{
                            bgcolor: '#22C55E',
                            color: '#fff',
                            mr: 1,
                            textTransform: 'none',
                            fontSize: '12px',
                            py: 0.5,
                            px: 1.5,
                            '&:hover': { boxShadow: '0 6px 18px rgba(0,0,0,0.25)', transform: 'translateY(-1px)' },
                          }}
                        >
                          Aprovar
                        </Button>

                        <Button
                          onClick={() => handleStatusChange(pedido.id, 'cancelado')}
                          size="small"
                          variant="contained"
                          sx={{
                            bgcolor: '#EF4444',
                            color: '#fff',
                            textTransform: 'none',
                            fontSize: '12px',
                            py: 0.5,
                            px: 1.5,
                            mr: 1,
                            '&:hover': { boxShadow: '0 6px 18px rgba(0,0,0,0.25)', transform: 'translateY(-1px)' },
                          }}
                        >
                          Cancelar
                        </Button>

                        <Button
                          onClick={async () => {
                            if (!qzConnected) await connectQZ();
                            if (!aprovado) {
                              const ok = window.confirm('Este pedido ainda não está aprovado. Deseja imprimir mesmo assim?');
                              if (!ok) return;
                            }
                            await printPedido(pedido);
                          }}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: aprovado ? '#111827' : '#9CA3AF',
                            color: aprovado ? '#111827' : '#6B7280',
                            textTransform: 'none',
                            fontSize: '12px',
                            py: 0.5,
                            px: 1.5
                          }}
                        >
                          Imprimir
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>

          {/* Paginação */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mr: 2 }}>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
              <Button
                key={page}
                onClick={() => setCurrentPage(page)}
                sx={{
                  minWidth: '40px',
                  height: '40px',
                  border: '1px solid #D1D5DB',
                  bgcolor: page === currentPage ? '#F3F4F6' : '#FFFFFF',
                  color: '#374151',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {page}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Modal de novo pedido */}
      <NovoPedidoModal
        open={novoOpen}
        onClose={() => setNovoOpen(false)}
        onCreated={() => { /* em tempo real: nada a fazer */ }}
      />

      {/* Modal de pagamento */}
      <PagamentoDialog
        open={payOpen}
        pedido={payPedido}
        onClose={() => { setPayOpen(false); setPayPedido(null); }}
        onConfirm={(pg) => approveWithPayment(payPedido, pg)}
      />
    </Box>
  );
}
