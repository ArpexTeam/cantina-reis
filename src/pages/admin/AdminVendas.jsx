import React from 'react';
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
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import logo from '../../img/ChatGPT Image 23 de abr. de 2025, 20_03_44 (1) 2.svg';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export default function AdminVendas() {
  const pedidos = [
    { data: "01/07/2025", nome: "Fernanda Borges", nPedido: 2345, valor: "R$ 23,00", status: "Completo" },
    { data: "02/07/2025", nome: "Fernanda Borges", nPedido: 2346, valor: "R$ 45,00", status: "Completo" },
    { data: "03/07/2025", nome: "Fernanda Borges", nPedido: 2347, valor: "R$ 30,00", status: "Cancelado" },
    { data: "04/07/2025", nome: "Fernanda Borges", nPedido: 2348, valor: "R$ 50,00", status: "Completo" },
    { data: "05/07/2025", nome: "Fernanda Borges", nPedido: 2349, valor: "R$ 20,00", status: "Cancelado" },
  ];

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const getStatusColor = (status) => {
    switch (status) {
      case "Completo": return "#DEF7EC";
      case "Cancelado": return "#FDE8E8";
      default: return "#E0E0E0";
    }
  };

  const getStatusFontColor = (status) => {
    switch (status) {
      case "Completo": return "#03543F";
      case "Cancelado": return "#9B1C1C";
      default: return "#E0E0E0";
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, bgcolor: '#F8F8F8' }}>
        {/* Header COM FAIXA PRETA */}
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
          <Box>
            <Typography sx={{ mr: 2, fontFamily: 'Poppins, sans-serif' }}>
              Administrador
            </Typography>
            <Avatar src="https://via.placeholder.com/150" />
          </Box>
        </Box>

        <Box sx={{ p: 4 }}>
          {/* Título */}
          <Typography variant="h6" fontWeight="bold" textAlign="center">Página de vendas</Typography>
          <Box sx={{ borderBottom: '2px solid black', width: '100%', mt: 1, mb: 4 }} />

          {/* Barra de busca */}
          <Box sx={{ display: 'flex', mb: 2, justifyContent: 'space-between' }}>
            <TextField
              placeholder="Search"
              size="small"
              variant="outlined"
              sx={{
                maxWidth: '40%',
                flex: 1,
                bgcolor: '#fff',
                borderRadius: '6px',
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'Poppins, sans-serif',
                },
              }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: '#9CA3AF', mr: 1 }} fontSize="small" />
                ),
                sx: {
                  height: '40px',
                  pl: 1,
                },
              }}
            />

            {/* DROPDOWN */}
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
              Últimos 30 dias
            </Button>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              <MenuItem onClick={handleClose}>Últimos 7 dias</MenuItem>
              <MenuItem onClick={handleClose}>Últimos 30 dias</MenuItem>
              <MenuItem onClick={handleClose}>Últimos 90 dias</MenuItem>
            </Menu>
          </Box>

          {/* Tabela */}
          <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>DATA</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>NOME</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>N PEDIDO</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>VALOR</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pedidos.map((pedido, index) => (
                  <TableRow key={index}>
                    <TableCell>{pedido.data}</TableCell>
                    <TableCell>{pedido.nome}</TableCell>
                    <TableCell>{pedido.nPedido}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{pedido.valor}</TableCell>
                    <TableCell>
                      <Box sx={{
                        display: 'inline-block',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '4px',
                        bgcolor: getStatusColor(pedido.status),
                        color: getStatusFontColor(pedido.status),
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: 'Poppins, sans-serif'
                      }}>
                        {pedido.status}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {/* Paginação NOVA */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            {[['‹'], [1], [2], [3], ['›']].map((item, index) => {
              const isActive = item[0] === 2; // página atual
              return (
                <Button
                  key={index}
                  size="small"
                  sx={{
                    minWidth: '40px',
                    height: '40px',
                    border: '1px solid #D1D5DB',
                    bgcolor: isActive ? '#F3F4F6' : '#FFFFFF',
                    color: '#374151',
                    borderRadius: 0,
                    fontFamily: 'Poppins, sans-serif',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: isActive ? '#F3F4F6' : '#F9FAFB',
                    },
                  }}
                >
                  {item}
                </Button>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
