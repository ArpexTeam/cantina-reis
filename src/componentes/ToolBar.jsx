import React from 'react';
import { Box, Button, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ShareIcon from '@mui/icons-material/Share';
import { Link } from 'react-router-dom';


export default function Toolbar() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'start',
        alignItems: 'center',
        justifyContent:'space-between',
        backgroundColor: '#f5f5f5',
        padding: '12px 8px',
        width:"100vw",
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* Botão de busca com fundo branco e sombra leve */}
      <Button
        component={Link}
        to="/search"
        sx={{
          backgroundColor: '#fff',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          height: '30px',
          padding:'5px',
          minWidth:'0',
        }}
      >
        <SearchIcon sx={{ color: '#000', fontSize: 20 }} />
      </Button>

      {/* Botões à direita */}
      <Box sx={{ display: 'flex', gap: '12px', }}>
        <Button
          variant="contained"
          disableElevation
          startIcon={<RoomOutlinedIcon />}
          component='a'
          target="_blank"
          href='https://maps.app.goo.gl/XdhApJN9sTzrD1nh8'
          rel="noopener noreferrer"
          sx={{
            backgroundColor: '#fff',
            color: '#000',
            borderRadius: '5px',
            textTransform: 'none',
            fontSize: '10px',
            fontWeight: 500,
            padding: '8px 12px',
            minWidth: 'auto',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            textWrap:'nowrap',
            height:'fit-content',
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
            backgroundColor: '#fff',
            color: '#000',
            borderRadius: '5px',
            textTransform: 'none',
            fontSize: '10px',
            fontWeight: 500,
            padding: '8px 12px',
            minWidth: 'auto',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            textWrap:'nowrap',
            height:'fit-content',
          }}
        >
          Informações
        </Button>

        <IconButton
          sx={{
            backgroundColor: '#fff',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            width: '30px',
            height: '30px',
            padding: '18px',
          }}
        >
          <ShareIcon sx={{ color: '#000', fontSize: 20 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
