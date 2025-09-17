// src/pages/admin/AdminVendas.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  TextField,
  MenuItem,
  Menu
} from '@mui/material';
import Sidebar from '../../componentes/admin/sidebar';
import logo from '../../img/ChatGPT Image 23 de abr. de 2025, 20_03_44 (1) 2.svg';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { db } from '../../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

// ---- helpers ----
const fmtBRL = (v) =>
  Number(v ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const startOfTodayLocal = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'aprovado':
    case 'completo':
    case 'entregue':
      return '#DEF7EC';
    case 'cancelado':
      return '#FDE8E8';
    default:
      return '#E0E0E0';
  }
};

const getStatusFontColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'aprovado':
    case 'completo':
      return '#03543F';
    case 'cancelado':
      return '#9B1C1C';
    default:
      return '#6B7280';
  }
};

// --------- Paginação com mesmo estilo da página de produtos ----------
function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const items = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      {items.map((p, idx) => {
        const active = p === page;
        return (
          <Box
            key={p}
            component="button"
            onClick={() => !active && onChange(p)}
            disabled={active}
            aria-current={active ? 'page' : undefined}
            sx={{
              fontFamily: 'Poppins, sans-serif',
              minWidth: 40,
              height: 40,
              px: 0,
              m: 0,
              cursor: active ? 'default' : 'pointer',
              border: '1px solid #D1D5DB',
              borderLeftWidth: idx === 0 ? '1px' : '0px', // junta as bordas
              bgcolor: active ? '#F3F4F6' : '#FFFFFF',
              color: '#374151',
              borderRadius: 0,
              outline: 'none',
              '&:hover': {
                bgcolor: active ? '#F3F4F6' : '#F9FAFB'
              }
            }}
          >
            {p}
          </Box>
        );
      })}
    </Box>
  );
}

export default function AdminVendas() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // filtros simples de período (opcional, fora de "hoje")
  const [periodoDias, setPeriodoDias] = useState(30);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // paginação (igual à de produtos)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // recalcula limites de data baseado no período
  const limitesData = useMemo(() => {
    const hoje0 = startOfTodayLocal();
    const inicio = new Date(hoje0);
    inicio.setDate(inicio.getDate() - periodoDias);
    return {
      inicioTS: Timestamp.fromDate(inicio),
      hoje0TS: Timestamp.fromDate(hoje0),
    };
  }, [periodoDias]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);

        const col = collection(db, 'pedidos');
        const qRef = query(
          col,
          where('status', 'in', ['aprovado', 'cancelado']),
          where('createdAt', '>=', limitesData.inicioTS),
          where('createdAt', '<', limitesData.hoje0TS),
          orderBy('createdAt', 'desc')
        );

        const snap = await getDocs(qRef);
        const data = snap.docs.map((d) => {
          const obj = d.data() || {};
          const created = obj.createdAt?.toDate?.() || null;

          const orderCode = obj.orderCode || obj.pagamento?.orderNumber || d.id;
          const total = Number(obj.total ?? 0);
          const nome = obj.nome || obj.cliente?.nome || obj.customer?.fullName || '';

          return {
            id: d.id,
            data: created,
            nome,
            orderCode,
            total,
            status: obj.status || '',
          };
        });

        setRows(data);
        setCurrentPage(1); // reset quando muda o período
      } catch (e) {
        console.error('Erro ao carregar vendas:', e);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [limitesData]);

  // busca simples (por nome, orderCode, status)
  const filtrados = useMemo(() => {
    const t = (search || '').toLowerCase().trim();
    if (!t) return rows;
    return rows.filter((r) => {
      const campos = [r.nome || '', String(r.orderCode || ''), String(r.status || '')]
        .join(' ')
        .toLowerCase();
      return campos.includes(t);
    });
  }, [rows, search]);

  // paginação
  const totalPages = Math.ceil(filtrados.length / itemsPerPage) || 1;
  const current = Math.min(currentPage, totalPages);
  const exibidos = filtrados.slice((current - 1) * itemsPerPage, current * itemsPerPage);

  const handleClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <Box sx={{ display: 'flex', fontFamily: 'Poppins, sans-serif' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, bgcolor: '#F1F1F1',}}>
        {/* Header */}
        <Box
          sx={{
            width: '100%',
            height: 80,
            px: 4,
            backgroundColor: '#000',
            color: '#FFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxSizing: 'border-box',
            position: 'absolute',
            left: 0,
            zIndex: 10
          }}
        >
          <Box sx={{ height: 70, width: 'auto' }}>
            <img src={logo} alt="Logo" style={{ width: "100%", height: "100%" }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
            <Avatar src="https://via.placeholder.com/150" />
            <Typography component="span" sx={{ display: 'inline-flex' }}>
              Administrador
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 12 }}>
          <Typography variant="h6" fontWeight="bold" textAlign="center">Página de vendas</Typography>
          <Box sx={{ borderBottom: '2px solid black', width: '100%', mt: 1, mb: 4 }} />

          {/* Busca + período */}
          <Box sx={{ display: 'flex', mb: 2, justifyContent: 'space-between', gap: 2 }}>
            <TextField
              placeholder="Pesquisar por nome, nº pedido, status…"
              size="small"
              variant="outlined"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              sx={{
                maxWidth: '40%',
                flex: 1,
                bgcolor: '#fff',
                borderRadius: '6px',
                '& .MuiOutlinedInput-root': { fontFamily: 'Poppins, sans-serif' },
              }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: '#9CA3AF', mr: 1 }} fontSize="small" />
                ),
                sx: { height: '40px', pl: 1 },
              }}
            />

            <Button
              variant="outlined"
              onClick={handleClick}
              startIcon={<AccessTimeIcon />}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                textTransform: 'none',
                color: '#111827',
                fontFamily: 'Poppins, sans-serif',
                height: 40,
              }}
            >
              Últimos {periodoDias} dias (exclui hoje)
            </Button>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              {[7, 30, 90].map((d) => (
                <MenuItem
                  key={d}
                  onClick={() => {
                    setPeriodoDias(d);
                    setCurrentPage(1);
                    handleClose();
                  }}
                >
                  Últimos {d} dias (exclui hoje)
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Tabela */}
          <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>DATA</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>NOME</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>Nº PEDIDO</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>VALOR</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                      Carregando…
                    </TableCell>
                  </TableRow>
                ) : exibidos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                      Nada encontrado para o período/termo aplicado.
                    </TableCell>
                  </TableRow>
                ) : (
                  exibidos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.data ? p.data.toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell>{p.nome || '-'}</TableCell>
                      <TableCell>{p.orderCode}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>R$ {fmtBRL(p.total)}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '4px',
                            bgcolor: getStatusColor(p.status),
                            color: getStatusFontColor(p.status),
                            fontSize: '12px',
                            fontWeight: 600,
                            fontFamily: 'Poppins, sans-serif',
                            textTransform: 'capitalize',
                          }}
                        >
                          {p.status}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>

          {/* Paginação (igual à outra página) */}
          <Pager page={current} totalPages={totalPages} onChange={setCurrentPage} />
        </Box>
      </Box>
    </Box>
  );
}
