import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import Sidebar from '../../componentes/admin/sidebar';
import logo from '../../img/ChatGPT Image 23 de abr. de 2025, 20_03_44 (1) 2.svg';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

// Ícones
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';

import { getAuth } from "firebase/auth";



export default function AdminDashboard() {

  const auth = getAuth();
console.log("Usuário atual:", auth.currentUser);
  const [totalProdutosVendidos, setTotalProdutosVendidos] = useState(0);
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [clientesAtendidos, setClientesAtendidos] = useState(0);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const pedidosSnapshot = await getDocs(collection(db, 'pedidos'));
        let totalVendasTemp = 0;
        let totalProdutosTemp = 0;
        let pedidosAprovados = 0;
        let clientesSet = new Set();

        const statusAceitos = ['aprovado', 'pago'];

        pedidosSnapshot.forEach((doc) => {
          const data = doc.data();

          if (statusAceitos.includes(data.status)) {
            pedidosAprovados++;

            if (Array.isArray(data.itens)) {
              data.itens.forEach((item) => {
                totalProdutosTemp += item.quantidade || 0;
                totalVendasTemp += (item.quantidade || 0) * (item.preco || 0);
              });
            }

            if (data.telefone) clientesSet.add(data.telefone);
          }
        });

        const ticketMedioTemp = pedidosAprovados > 0 ? totalVendasTemp / pedidosAprovados : 0;

        setTotalProdutosVendidos(totalProdutosTemp);
        setTotalVendas(totalVendasTemp);
        setTotalPedidos(pedidosAprovados);
        setTicketMedio(ticketMedioTemp);
        setClientesAtendidos(clientesSet.size);

        const produtosSnapshot = await getDocs(collection(db, 'produtos'));
        const produtosBaixo = produtosSnapshot.docs.filter(
          (doc) => {
            const data = doc.data();
            return data.estoque !== undefined && data.estoqueMin !== undefined && data.estoque <= data.estoqueMin;
          }
        ).length;

        setProdutosBaixoEstoque(produtosBaixo);

      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const cards = [
    {
      icon: <ShoppingCartIcon className="CardIcon" sx={{ fontSize: 40, color: '#4B5563' }} />,
      label: 'Produtos vendidos',
      value: totalProdutosVendidos,
    },
    {
      icon: <AttachMoneyIcon className="CardIcon" sx={{ fontSize: 40, color: '#4B5563' }} />,
      label: 'Total arrecadado',
      value: `R$ ${totalVendas.toFixed(2)}`,
    },
    {
      icon: <LocalOfferIcon className="CardIcon" sx={{ fontSize: 40, color: '#4B5563' }} />,
      label: 'Pedidos aprovados',
      value: totalPedidos,
    },
    {
      icon: <TrendingUpIcon className="CardIcon" sx={{ fontSize: 40, color: '#4B5563' }} />,
      label: 'Ticket médio',
      value: `R$ ${ticketMedio.toFixed(2)}`,
    },
    {
      icon: <PeopleIcon className="CardIcon" sx={{ fontSize: 40, color: '#4B5563' }} />,
      label: 'Clientes atendidos',
      value: clientesAtendidos,
    },
    {
      icon: <WarningIcon className="CardIcon" sx={{ fontSize: 40, color: '#4B5563' }} />,
      label: 'Estoque baixo',
      value: produtosBaixoEstoque,
    },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, bgcolor: '#F8F8F8' }}>
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
          <Box>
            <Typography sx={{ mr: 2, fontFamily: 'Poppins, sans-serif' }}>
              Administrador
            </Typography>
            <Avatar src="https://via.placeholder.com/150" />
          </Box>
        </Box>

        {/* Conteúdo principal */}
        <Box sx={{ p: 4, mt: 10 }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            textAlign="center"
            sx={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Painel de controle
          </Typography>
          <Box sx={{ borderBottom: '2px solid black', width: '100%', mt: 1, mb: 4 }} />

          {/* Cards */}
<Box
  sx={{
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    maxWidth: '1200px',
    mx: 'auto',
  }}
>
{cards.map((item, index) => (
  <Box
    key={index}
    sx={{
      flex: '1 1 calc(33.333% - 32px)',
      minWidth: '250px',
      maxWidth: '300px',
    }}
  >
    <Paper
      elevation={4}
      sx={{
        p: 0,
        display: 'flex',
        alignItems: 'stretch',
        bgcolor: '#fff',
        borderRadius: 4,
        height: 160,
        minWidth: 220,
        maxWidth: 350,
        boxShadow: '0 2px 10px 0 rgba(0,0,0,0.07)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.22s cubic-bezier(.4,2,.3,1), box-shadow 0.2s, border 0.22s',
        border: '2px solid #fff',
        '&:hover': {
          boxShadow: '0 6px 28px 0 rgba(255,107,44,0.14), 0 1.5px 12px 0 rgba(0,0,0,0.08)',
          border: '2px solid #FF6B2C',
          transform: 'scale(1.035) translateY(-3px)',
          '.CardOrange': {
            filter: 'brightness(1.1) drop-shadow(0 0 6px #FF6B2C55)',
          },
          '.CardIcon': {
            color: '#fff',
            filter: 'drop-shadow(0 0 8px #fff5)'
          },
        },
      }}
    >
      {/* Lateral laranja ultra-arredondada */}
      <Box
        className="CardOrange"
        sx={{
          width: 70,
          height: '100%',
          minWidth: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: '#FF6B2C',
          borderRadius: '0 48px 48px 0 / 0 100% 100% 0',
          boxShadow: '0 0 12px #FF6B2C22',
          zIndex: 1,
        }}
      >
        <Box className="CardIcon" sx={{
          position: 'relative',
          zIndex: 2,
          fontSize: 32,
          color: '#fff',
          transition: 'color 0.22s, filter 0.22s',
        }}>
          {React.cloneElement(item.icon, { sx: { fontSize: 36, color: 'inherit' } })}
        </Box>
      </Box>

      {/* Conteúdo */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 1,
          px: 2,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={400}
          fontSize="16px"
          sx={{ fontFamily: 'Poppins, sans-serif', mb: 0.5 }}
        >
          {item.label}
        </Typography>
        <Typography
          variant="h6"
          fontSize="32px"
          fontWeight={800}
          sx={{
            fontFamily: 'Poppins, sans-serif',
            lineHeight: 1,
            letterSpacing: '1px'
          }}
        >
          {item.value}
        </Typography>
      </Box>
    </Paper>
  </Box>
))}

</Box>
        </Box>
      </Box>
    </Box>
  );
}
