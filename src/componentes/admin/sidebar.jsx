import React, { useState } from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import {
  FiHome,
  FiClipboard,
  FiShoppingBag,
  FiFileText,
  FiSettings,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const [openCardapio, setOpenCardapio] = useState(true);
  const navigate = useNavigate();

  const handleClick = () => {
    setOpenCardapio(!openCardapio);
  };

  return (
    <Box
      sx={{
        width: 240,
        height: '100vh',
        bgcolor: '#fff',
        borderRight: '1px solid #E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        paddingTop: 12,
      }}
    >
      <List component="nav">
        {/* Painel de controle */}
        <ListItemButton onClick={() => navigate('/admin')}>
          <ListItemIcon sx={{ minWidth: 30 }}>
            <FiHome size={18} />
          </ListItemIcon>
          <ListItemText
            primary="Painel de controle"
            primaryTypographyProps={{
              fontSize: 14,
              fontFamily: 'Poppins, sans-serif'
            }}
          />
        </ListItemButton>

        {/* Cardápio com subitens */}
        <ListItemButton onClick={handleClick}>
          <ListItemIcon sx={{ minWidth: 30 }}>
            <FiClipboard size={18} />
          </ListItemIcon>
          <ListItemText
            primary="Cardápio"
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: openCardapio ? 700 : 400,
              fontFamily: 'Poppins, sans-serif'
            }}
          />
          {openCardapio ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </ListItemButton>

        <Collapse in={openCardapio} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton sx={{ pl: 4 }} onClick={() => navigate('/adminProducts')}>
              <ListItemText
                primary="Produtos"
                primaryTypographyProps={{
                  fontSize: 14,
                  fontFamily: 'Poppins, sans-serif'
                }}
              />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }} onClick={() => navigate('/adminPedidos')}>
              <ListItemText
                primary="Pedidos"
                primaryTypographyProps={{
                  fontSize: 14,
                  fontFamily: 'Poppins, sans-serif'
                }}
              />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Vendas */}
        <ListItemButton onClick={() => navigate('/adminVendas')}>
          <ListItemIcon sx={{ minWidth: 30 }}>
            <FiShoppingBag size={18} />
          </ListItemIcon>
          <ListItemText
            primary="Vendas"
            primaryTypographyProps={{
              fontSize: 14,
              fontFamily: 'Poppins, sans-serif'
            }}
          />
        </ListItemButton>

        {/* Nota fiscal */}
        <ListItemButton onClick={() => navigate('/info')}>
          <ListItemIcon sx={{ minWidth: 30 }}>
            <FiFileText size={18} />
          </ListItemIcon>
          <ListItemText
            primary="Nota fiscal"
            primaryTypographyProps={{
              fontSize: 14,
              fontFamily: 'Poppins, sans-serif'
            }}
          />
        </ListItemButton>

        {/* Configurações */}
        <ListItemButton onClick={() => navigate('/adminConfiguracoes')}>
          <ListItemIcon sx={{ minWidth: 30 }}>
            <FiSettings size={18} />
          </ListItemIcon>
          <ListItemText
            primary="Configurações"
            primaryTypographyProps={{
              fontSize: 14,
              fontFamily: 'Poppins, sans-serif'
            }}
          />
        </ListItemButton>
      </List>
    </Box>
  );
}
