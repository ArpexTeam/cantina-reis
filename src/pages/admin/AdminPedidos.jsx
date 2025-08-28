import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Avatar, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Button, TextField, Stack
} from '@mui/material';
import Sidebar from '../../componentes/admin/sidebar';
import {
  collection, getDocs, query, where, Timestamp,
  updateDoc, doc, runTransaction, orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';
import logo from '../../img/ChatGPT Image 23 de abr. de 2025, 20_03_44 (1) 2.svg';
import SearchIcon from '@mui/icons-material/Search';
import { format } from 'date-fns';
import NovoPedidoModal from '../../componentes/admin/NovoPedidoModal';

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [novoOpen, setNovoOpen] = useState(false);

  // --- helpers de cor do status
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

  // --- calcula limites de "hoje"
  const makeTodayBounds = () => {
    const now = new Date();
    const hoje0 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const amanha0 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return {
      hoje0TS: Timestamp.fromDate(hoje0),
      amanha0TS: Timestamp.fromDate(amanha0),
    };
  };

  const loadPedidos = async () => {
    try {
      const { hoje0TS, amanha0TS } = makeTodayBounds();
      const qy = query(
        collection(db, 'pedidos'),
        where('createdAt', '>=', hoje0TS),
        where('createdAt', '<', amanha0TS),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(qy);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPedidos(rows);
    } catch (e) {
      console.error('Erro ao buscar pedidos:', e);
    }
  };

  useEffect(() => {
    loadPedidos();
  }, []);

  // Aprova pedido + baixa estoque se for "No caixa" pendente
  const handleStatusChange = async (pedidoId, novoStatus) => {
    try {
      const pedido = pedidos.find((p) => p.id === pedidoId);
      if (!pedido) return;

      const isPendenteOffline =
        pedido.status === 'pendente' &&
        (pedido.pagamento?.provedor === 'offline' || pedido.tipoServico === 'No caixa');

      if (novoStatus === 'aprovado' && isPendenteOffline) {
        await runTransaction(db, async (transaction) => {
          // baixa estoque de todos os itens
          for (const item of (pedido.itens || [])) {
            const prodId = item.id;
            const qtd = Number(item.quantidade ?? item.quantity ?? 1);
            if (!prodId || !qtd || qtd <= 0) continue;

            const prodRef = doc(db, 'produtos', prodId);
            const snap = await transaction.get(prodRef);
            if (!snap.exists()) {
              throw new Error(`Produto ${prodId} não encontrado.`);
            }
            const dados = snap.data();
            const estoqueAtual = Number(dados?.estoque ?? 0);
            if (estoqueAtual < qtd) {
              throw new Error(`Estoque insuficiente para "${dados?.nome || prodId}". Disp.: ${estoqueAtual}, solic.: ${qtd}`);
            }
            transaction.update(prodRef, { estoque: estoqueAtual - qtd });
          }

          // atualiza status do pedido
          const pedidoRef = doc(db, 'pedidos', pedidoId);
          transaction.update(pedidoRef, { status: 'aprovado' });
        });

        setPedidos((prev) =>
          prev.map((p) => (p.id === pedidoId ? { ...p, status: 'aprovado' } : p))
        );
        return;
      }

      // Demais mudanças de status (ex.: cancelar)
      const pedidoRef = doc(db, 'pedidos', pedidoId);
      await updateDoc(pedidoRef, { status: novoStatus });
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, status: novoStatus } : p))
      );
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert(error.message || 'Erro ao atualizar status do pedido.');
    }
  };

  // Busca/filtra local
  const pedidosFiltrados = pedidos.filter((p) => {
    const t = searchTerm.toLowerCase();
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
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="nowrap">
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
                          ? format(pedido.createdAt.toDate(), 'dd/MM/yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleStatusChange(pedido.id, 'aprovado')}
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
        onCreated={() => loadPedidos()}
      />
    </Box>
  );
}
