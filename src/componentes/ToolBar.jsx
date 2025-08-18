import React from 'react';
import { Box, Button, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Link } from 'react-router-dom';
import pin from '../img/pinIcon.svg';
import share from '../img/shareIcon.svg';

export default function Toolbar() {
  const onShare = async () => {
    const shareData = {
      title: document.title || 'Cantina Reis',
      text: 'Dá uma olhada no cardápio da Cantina Reis!',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copiado para a área de transferência!');
      }
    } catch {}
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: '#f5f5f5',
        width: '100%',
        maxWidth: { md: 980, lg: 1200 },
        mx: 'auto',
        px: { xs: 1.5, md: 2 },
        py: { xs: 1, md: 1.5 },
        fontFamily: 'Poppins, sans-serif',
        gap: 1.5,
      }}
    >
      {/* Busca */}
      <Button
        component={Link}
        to="/search"
        aria-label="Buscar"
        sx={{
          bgcolor: '#fff',
          boxShadow: '4px 3px 6px rgba(0,0,0,0.10)',
          borderRadius: '8px',
          minWidth: 0,
          p: { xs: 1, md: 0.75 },
          height: { xs: 32, md: 36 },
          '&:hover': { bgcolor: '#fff', boxShadow: '0 3px 10px rgba(0,0,0,0.12)' },
        }}
      >
        <SearchIcon sx={{ color: '#111', fontSize: { xs: 20, md: 22 } }} />
      </Button>

      {/* Ações à direita */}
      <Box sx={{ display: 'flex', gap: { xs: 1, md: 1.5 }, alignItems: 'center' }}>
        <Button
          variant="contained"
          disableElevation
          startIcon={
            <img
              src={pin}
              alt=""
              style={{ width: 16, height: 16, display: 'block' }}
            />
          }
          component="a"
          target="_blank"
          href="https://maps.app.goo.gl/XdhApJN9sTzrD1nh8"
          rel="noopener noreferrer"
          sx={{
            bgcolor: '#fff',
            color: '#000',
            borderRadius: '6px',
            textTransform: 'none',
            fontSize: { xs: 10, md: 12 },
            fontWeight: 600,
            px: { xs: 1, md: 1.5 },
            py: { xs: 0.75, md: 1 },
            minWidth: 'auto',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 2px rgba(0,0,0,0.10)',
            '&:hover': { bgcolor: '#f9fafb', boxShadow: '0 3px 10px rgba(0,0,0,0.12)' },
            gap: { xs: 0.5, md: 0.75 },
          }}
        >
          Ver mapa
        </Button>

        <Button
          variant="contained"
          component={Link}
          to="/info"
          disableElevation
          startIcon={<InfoOutlinedIcon />}
          sx={{
            bgcolor: '#fff',
            color: '#000',
            borderRadius: '6px',
            textTransform: 'none',
            fontSize: { xs: 10, md: 12 },
            fontWeight: 600,
            px: { xs: 1, md: 1.5 },
            py: { xs: 0.75, md: 1 },
            minWidth: 'auto',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 2px rgba(0,0,0,0.10)',
            '&:hover': { bgcolor: '#f9fafb', boxShadow: '0 3px 10px rgba(0,0,0,0.12)' },
            gap: { xs: 0.5, md: 0.75 },
          }}
        >
          Informações
        </Button>

        <IconButton
          aria-label="Compartilhar"
          onClick={onShare}
          sx={{
            bgcolor: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.10)',
            borderRadius: '8px',
            width: { xs: 32, md: 36 },
            height: { xs: 32, md: 36 },
            p: 0,
            '&:hover': { bgcolor: '#f9fafb', boxShadow: '0 3px 10px rgba(0,0,0,0.12)' },
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <img src={share} alt="Compartilhar" style={{ width: 18, height: 18, display: 'block' }} />
        </IconButton>
      </Box>
    </Box>
  );
}
