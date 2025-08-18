import { Box, Button, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/free-mode';
import { FreeMode } from 'swiper/modules';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const ACTIVE_BG = '#FFD9CD';     // pêssego do mock
const ACTIVE_LINE = '#FF6B2C';   // laranja da linha
const INACTIVE = '#707070';      // cinza texto inativo
const ACTIVE_TXT = '#111827';

const TabSelection = ({ onTabChange }) => {
  const [selectedTab, setSelectedTab] = useState('todas');
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const qs = await getDocs(collection(db, 'categorias'));
        const cats = qs.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(c => !!c?.nome);
        cats.sort((a,b) => String(a.nome).localeCompare(String(b.nome)));
        setCategorias(cats);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const isSelected = (key) => selectedTab === key;

  const handleTabClick = (key) => {
    setSelectedTab(key);
    onTabChange?.(key);
  };

  const pillSx = (active) => ({
    // dimensões e layout
    height: 36,
    px: 4.50,               // ~18px
    py:3,
    minWidth: 'auto',
    borderRadius: '3px 3px 0 0',

    // cores/estados
    backgroundColor: active ? ACTIVE_BG : 'transparent',
    color: active ? ACTIVE_TXT : INACTIVE,
    boxShadow: active ? `inset 0 -2px 0 ${ACTIVE_LINE}` : 'none', // linha inferior fina
    textTransform: 'none',

    // tipografia
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 800,
    letterSpacing: 0,
    '&:hover': {
      backgroundColor: active ? ACTIVE_BG : 'transparent',
      boxShadow: active ? `inset 0 -2px 0 ${ACTIVE_LINE}` : 'none',
    },
  });

  const labelSx = { fontSize: 12, fontWeight: 800, lineHeight: 1 };

  return (
    <Box
      role="tablist"
      aria-label="Categorias"
      sx={{
        width: '100%',
        fontFamily: 'Poppins, sans-serif',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: 'white',
      }}
    >
      <Swiper
        modules={[FreeMode]}
        freeMode
        slidesPerView="auto"
        spaceBetween={0}                 // sem espaços entre as abas
        style={{ padding: 0 }}
      >
        {/* TODAS */}
        <SwiperSlide style={{ width: 'auto' }}>
          <Button
            role="tab"
            aria-selected={isSelected('todas')}
            onClick={() => handleTabClick('todas')}
            disableRipple
            sx={pillSx(isSelected('todas'))}
          >
            <Typography sx={labelSx}>TODAS</Typography>
          </Button>
        </SwiperSlide>

        {categorias.map((cat) => {
          const key = String(cat.nome || '').toLowerCase();
          return (
            <SwiperSlide key={cat.id} style={{ width: 'auto' }}>
              <Button
                role="tab"
                aria-selected={isSelected(key)}
                onClick={() => handleTabClick(key)}
                disableRipple
                sx={pillSx(isSelected(key))}
              
              >
                <Typography sx={labelSx}>
                  {String(cat.nome).toUpperCase()}
                </Typography>
              </Button>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </Box>
  );
};

export default TabSelection;
