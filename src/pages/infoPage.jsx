import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  IconButton
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
          setAbertoGeral(data.statusManual || false);
          setDias(data.dias || []);
        }
      } catch (error) {
        console.error('Erro ao buscar horários:', error);
      }
    };

    fetchConfig();
  }, []);

  return (
    <Container maxWidth="sm" sx={{ padding: 0, backgroundColor: "#F2F2F2", paddingBottom: 1 }}>
      <Box
        sx={{
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: 200,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          borderRadius: 2,
        }}
      >

          
        <img src={logo} alt="Logo" style={{ height: 80 }} />
        <Box
          sx={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            backgroundColor: '#fff',
            color: abertoGeral ? '#00B856' : '#c00',
            fontSize: '12px',
            borderRadius: '5px',
            padding: '2px 6px',
            fontWeight: 'bold',
          }}
        >
          {abertoGeral ? '🟢 Aberto' : '🔴 Fechado'}
        </Box>
            <IconButton
          onClick={() => navigate(-1)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2
          }}
        >
          <CloseIcon sx={{ color: 'white' }} />
  </IconButton>
      </Box>

      <Box sx={{ paddingX: 3 }}>
        <Typography variant="h5" align="center" fontWeight="bold" mt={3}>
          Informações
        </Typography>

        <Box mt={3}>
          <Typography fontWeight="bold" fontSize="16px" mb={0.5}>
            Endereço
          </Typography>
          <Typography fontSize="14px">
            Centro Universitário UniMetrocamp - Wyden, R. Dr. Sales de Oliveira, 1661 – Vila Industrial (Campinas), Campinas - SP, 13035-500
          </Typography>
        </Box>

        <Box mt={4}>
          <Typography fontWeight="bold" fontSize="16px" mb={1}>
            Horário de funcionamento
          </Typography>
          <Box
            sx={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              padding: 2,
            }}
          >
            {dias.length > 0 ? (
              dias.map((item) => (
                <Grid
                  sx={{ marginBottom: 2 }}
                  container
                  justifyContent="space-between"
                  key={item.label}
                >
                  <Typography fontSize="14px" fontWeight="600">
                    {item.label}
                  </Typography>
                  <Typography fontSize="14px" fontWeight="600">
                    {item.enabled ? `${item.start} – ${item.end}` : (
                      <Box component="span" display="inline-flex" alignItems="center" gap={1}>
                        <FontAwesomeIcon icon={faClockRegular} /> Fechado
                      </Box>
                    )}
                  </Typography>
                </Grid>
              ))
            ) : (
              <Typography fontSize="14px">Carregando horários...</Typography>
            )}
          </Box>
        </Box>

        <Box mt={4} mb={5} textAlign={'center'}>
          <Typography fontWeight="bold" fontSize="16px" mb={1}>
            Tipos de serviços
          </Typography>
          <Box display="flex" flexDirection={'column'} justifyContent={'center'} alignItems={'center'} gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              sx={{ backgroundColor: '#FF5722', textTransform: 'none' }}
              startIcon={<RestaurantIcon />}
            >
              No local
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: '#FF5722', textTransform: 'none' }}
              startIcon={<LocalShippingIcon />}
            >
              Retirada
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: '#FF5722', textTransform: 'none' }}
              startIcon={<AccessTimeIcon />}
            >
              Agendar
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default InfoPage;
