// src/pages/InfoPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  IconButton,
  Paper,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock as faClockRegular } from '@fortawesome/free-regular-svg-icons';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import background from '../img/Frame26095426.jpg';
import logo from '../img/ChatGPT Image 23 de abr. de 2025, 20_03_44 (1) 2.svg';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import market from '../img/marketIcon.svg';
import packageIcon from '../img/packageIcon.svg';
import order from '../img/orderIcon.svg';


const InfoPage = () => {
  const [abertoGeral, setAbertoGeral] = useState(false);
  const [dias, setDias] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRef = doc(db, 'configuracoes', 'S7E8v2lrRGqeGUjH4sBV');
        const docSnap = await getDoc(configRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setAbertoGeral(
            typeof data.abertoGeral === 'boolean'
              ? data.abertoGeral
              : Boolean(data.aberto) // fallback
          );
          setDias(Array.isArray(data.dias) ? data.dias : []);
        }
      } catch (error) {
        console.error('Erro ao buscar horários:', error);
      }
    };

    fetchConfig();
  }, []);

  return (
    <Container
      maxWidth="lg"
      sx={{
        px: { xs: 0, sm: 2, md: 3 },
        py: { xs: 0, md: 4 },
        minHeight: '100vh',
        bgcolor: '#F5F5F5',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* HERO */}
      <Paper
        elevation={0}
        sx={{
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: { xs: 200, md: 320 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          borderRadius: { xs: 0, md: 2 },
          overflow: 'hidden',
          boxShadow: { xs: 'none', md: '0 2px 12px rgba(0,0,0,0.06)' },
          mb: { xs: 0, md: 2 },
        }}
      >
        <img src={logo} alt="Logo" style={{ height: 80 }} />

        <Box
          sx={{
            position: 'absolute',
            right: 12,
            bottom: 12,
            backgroundColor: '#fff',
            color: abertoGeral ? '#00B856' : '#c00',
            fontSize: 12,
            borderRadius: '6px',
            px: 1,
            py: 0.5,
            fontWeight: 'bold',
            boxShadow: '0 2px 10px rgba(0,0,0,.08)',
          }}
        >
          {abertoGeral ? '🟢 Aberto' : '🔴 Fechado'}
        </Box>

        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2,
            bgcolor: 'rgba(0,0,0,.45)',
            '&:hover': { bgcolor: 'rgba(0,0,0,.6)' },
          }}
          aria-label="Fechar"
        >
          <CloseIcon sx={{ color: 'white' }} />
        </IconButton>
      </Paper>

      {/* CONTEÚDO */}
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr' },
          gap: { xs: 0, md: 3 },
          alignItems: 'start',
          justifyItems: 'center',
          backgroundColor:'#F2F2F2',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', md: 900 },
            bgcolor: '#F2F2F2',
            borderRadius: { xs: 0, md: 2 },
            p: { xs: 3, md: 4 },
            boxShadow: { xs: 'none', md: '0 2px 12px rgba(0,0,0,0.06)' },
          }}
        >
          <Typography
            variant="h5"
            align="center"
            fontWeight={600}
            fontSize={24}
            sx={{ mt: { xs: 1, md: 0 } }}
          >
            Informações
          </Typography>

          {/* Endereço */}
          <Box mt={2} sx={{textAlign:'left'}}>
            <Typography fontWeight="bold" fontSize="16px" mb={0.5}>
              Endereço
            </Typography>
            <Typography fontSize="12px" fontWeight={400} sx={{backgroundColor:'white', padding:'3px', borderRadius:'5px'}}>
              Centro Universitário UniMetrocamp - Wyden, R. Dr. Sales de Oliveira, 1661 – Vila
              Industrial (Campinas), Campinas - SP, 13035-500
            </Typography>
          </Box>

          {/* Horário de funcionamento */}
          <Box mt={4} textAlign={'left'}>
            <Typography fontWeight={600} fontSize="16px" mb={1}>
              Horário de funcionamento
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                backgroundColor: '#FFFFFF',
                borderRadius: '5px',
                p: 2,
                borderColor: '#E5E7EB',
              }}
            >
              {dias && dias.length > 0 ? (
                dias.map((item) => (
                  <Grid
                    key={item.label}
                    container
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1.5, ':last-child': { mb: 0 } }}
                  >
                    <Typography fontSize="12px" fontWeight={600}>
                      {item.label}
                    </Typography>
                    <Typography fontSize="12px" fontWeight={600}>
                      {item.enabled ? (
                        `${item.start} – ${item.end}`
                      ) : (
                        <Box
                          component="span"
                          display="inline-flex"
                          alignItems="center"
                          gap={1}
                          sx={{ color: '#6B7280' }}
                        >
                          <FontAwesomeIcon icon={faClockRegular} /> Fechado
                        </Box>
                      )}
                    </Typography>
                  </Grid>
                ))
              ) : (
                <Typography fontSize="14px">Carregando horários...</Typography>
              )}
            </Paper>
          </Box>

          {/* Tipos de serviços */}
          <Box mt={4} mb={{ xs: 8, md: 2 }}>
            <Typography fontWeight={600} fontSize="16px" mb={1}>
              Tipos de serviços
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                alignItems: 'center',
              }}
            >
              <Button
                variant="contained"
                startIcon={<img src={market} />}
                sx={{
                  bgcolor: '#F75724',
                  textTransform: 'none',
                  borderRadius: '6px',
                  px: 2,
                  '&:hover': { bgcolor: '#e64c1a' },
                  minWidth: { md: 160 },
                  width:'fit-content'
                }}
              >
                No local
              </Button>

              <Button
                variant="contained"
                startIcon={<img src={packageIcon} />}
                sx={{
                  bgcolor: '#F75724',
                  textTransform: 'none',
                  borderRadius: '6px',
                  px: 2,
                  '&:hover': { bgcolor: '#e64c1a' },
                  minWidth: { md: 160 },
                  width:'fit-content'
                }}
              >
                Retirada
              </Button>

              <Button
                variant="contained"
                startIcon={<img src={order} />}
                sx={{
                  bgcolor: '#F75724',
                  textTransform: 'none',
                  borderRadius: '6px',
                  px: 2,
                  '&:hover': { bgcolor: '#e64c1a' },
                  minWidth: { md: 160 },
                  width:'fit-content'
                }}
              >
                Agendar
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default InfoPage;
