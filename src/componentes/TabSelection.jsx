import { Box, Button, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import './css/style.css';
import { FreeMode, Pagination } from 'swiper/modules';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // ajuste o caminho conforme sua estrutura

const TabSelection = ({ onTabChange }) => {
  const [selectedTab, setSelectedTab] = useState('todas');
  const [categorias, setCategorias] = useState([]);

  const handleTabClick = (tab) => {
    setSelectedTab(tab);
    if (onTabChange) onTabChange(tab); // Dispara callback para o pai
  };

useEffect(() => {
  const fetchCategorias = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categorias'));
      const categoriasFirebase = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategorias(categoriasFirebase);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  fetchCategorias();
}, []);

  return (
    <Box
      sx={{
        marginTop: '100px',
        width: '100vw',
        borderBottom: 1,
        borderColor: 'divider',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <Swiper
        slidesPerView={3}
        spaceBetween={5}
        freeMode={true}
        modules={[FreeMode, Pagination]}
        className="mySwiper"
      >
        <SwiperSlide>
          <Button
            onClick={() => handleTabClick('todas')}
            sx={{
              borderBottom: selectedTab === 'todas' ? '3px solid #F75724' : 'none',
              color: selectedTab === 'todas' ? 'black' : '#707070',
              backgroundColor: selectedTab === 'todas' ? '#FFD9CD' : '',
              fontWeight: '700',
              padding: '10px 20px',
              fontFamily: 'Poppins, sans-serif',
              textTransform: 'none',
            }}
          >
            <Typography variant="body1" sx={{ fontSize: '12px', fontWeight: '700' }}>
              TODAS
            </Typography>
          </Button>
        </SwiperSlide>

        {categorias.map((cat) => (
          <SwiperSlide key={cat.id}>
            <Button
              onClick={() => handleTabClick(cat.nome.toLowerCase())}
              sx={{
                borderBottom: selectedTab === cat.nome.toLowerCase() ? '3px solid #F75724' : 'none',
                color: selectedTab === cat.nome.toLowerCase() ? 'black' : '#707070',
                backgroundColor: selectedTab === cat.nome.toLowerCase() ? '#FFD9CD' : '',
                fontWeight: '700',
                padding: '10px 20px',
                fontFamily: 'Poppins, sans-serif',
                textTransform: 'none',
              }}
            >
              <Typography variant="body1" sx={{ fontSize: '12px', fontWeight: '700' }}>
                {cat.nome.toUpperCase()}
              </Typography>
            </Button>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
};

export default TabSelection;
