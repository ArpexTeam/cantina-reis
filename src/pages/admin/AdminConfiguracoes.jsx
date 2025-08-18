import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Switch, TextField, Stack, Avatar, IconButton, Button, Radio, RadioGroup, FormControlLabel, Checkbox } from '@mui/material';
import Sidebar from '../../componentes/admin/sidebar';
import UploadIcon from '@mui/icons-material/Upload';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import logo from '../../img/ChatGPT Image 23 de abr. de 2025, 20_03_44 (1) 2.svg';


export default function AdminConfiguracoes() {
  const [abertoGeral, setAbertoGeral] = useState(true);

  const [diasSemana, setDiasSemana] = useState([
    { label: 'Segunda-feira', enabled: true, start: '07:00', end: '18:00' },
    { label: 'Terça-feira', enabled: true, start: '07:00', end: '18:00' },
    { label: 'Quarta-feira', enabled: true, start: '07:00', end: '18:00' },
    { label: 'Quinta-feira', enabled: true, start: '07:00', end: '18:00' },
    { label: 'Sexta-feira', enabled: true, start: '07:00', end: '18:00' },
    { label: 'Sábado', enabled: false, start: '07:00', end: '18:00' },
    { label: 'Domingo', enabled: false, start: '07:00', end: '18:00' },
  ]);

  // 🔄 Puxa configurações do Firestore (opcional)
  useEffect(() => {
    const fetchData = async () => {
      const configRef = doc(db, 'configuracoes', 'S7E8v2lrRGqeGUjH4sBV');
      const snap = await getDoc(configRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.abertoGeral !== undefined) setAbertoGeral(data.abertoGeral);
        if (data.dias) setDiasSemana(data.dias);
      }
    };
    fetchData();
  }, []);

  const salvarHorarios = async () => {
    const configRef = doc(db, 'configuracoes', 'S7E8v2lrRGqeGUjH4sBV');
    await setDoc(configRef, {
      abertoGeral,
      dias: diasSemana
    });
    alert('Configurações salvas com sucesso!');
  };

  const toggleDia = (idx) => {
    const atualizado = [...diasSemana];
    atualizado[idx].enabled = !atualizado[idx].enabled;
    setDiasSemana(atualizado);
  };

  const updateHora = (idx, campo, valor) => {
    const atualizado = [...diasSemana];
    atualizado[idx][campo] = valor;
    setDiasSemana(atualizado);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#F1F1F1', fontFamily: 'Poppins, sans-serif' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, bgcolor: '#F1F1F1' }}>

            <Box sx={{
          width: '100%', height: 80, px: 4, backgroundColor: '#000',
          color: '#FFF', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', position: 'absolute', left: 0, zIndex: 10
        }}>
          <Box sx={{ height: 70 }}>
            <img src={logo} alt="Logo" style={{ height: '100%' }} />
          </Box>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="nowrap">
          <Avatar src="https://via.placeholder.com/150" />
          <Typography component="span">Administrador</Typography>
        </Stack>
        </Box>

      <Box sx={{ flexGrow: 1, p: 4, mt: 10  }}>
        {/* Título */}
        <Typography variant="h6" fontWeight="bold" textAlign="center">
          Configurações
        </Typography>
        <Box sx={{ borderBottom: '2px solid black', width: '100%', my: 2 }} />

        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {/* Alterar imagem */}
          <Box
            sx={{
              flex: '1 1 400px',
              textAlign: 'center',
              bgcolor: '#FFF',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              p: 4
            }}
          >
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Alterar imagem principal
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Typography mb={1} sx={{ fontSize: 14 }}>
                Imagem Desktop
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  width: '60%',
                  mx: 'auto',
                }}
              >
                <UploadIcon sx={{ fontSize: 48, color: '#000' }} />
              </Paper>
            </Box>

            <Box>
              <Typography mb={1} sx={{ fontSize: 14 }}>
                Imagem Mobile
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  width: '60%',
                  mx: 'auto',
                }}
              >
                <UploadIcon sx={{ fontSize: 48, color: '#000' }} />
              </Paper>
            </Box>
          </Box>

          {/* Funcionamento */}
          <Box sx={{ flex: '1 1 300px' }}>
            {/* 🔑 Funcionamento geral manual com Switch */}
            <Paper sx={{ p: 2, mb: 2, boxShadow: 1 }}>
            <Typography fontWeight={600} sx={{ mb: 1, fontFamily: 'Poppins, sans-serif', fontSize:'16px', textAlign:'left' }}>
                Funcionamento do restaurante
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Switch
                checked={abertoGeral}
                onChange={() => setAbertoGeral(true)}
                color="success"
                />
                <Typography sx={{ ml: 1 }}>Aberto</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                checked={!abertoGeral}
                onChange={() => setAbertoGeral(false)}
                color="default"
                />
                <Typography sx={{ ml: 1 }}>Fechado</Typography>
            </Box>
            </Paper>

            {/* Horários */}
            <Paper sx={{ p: 2 }}>
              <Typography fontWeight={600} textAlign={'left'} fontSize={'16px'} mb={2}>
                Editar horários semanais
              </Typography>

              {diasSemana.map((dia, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Checkbox
                    checked={dia.enabled}
                    onChange={() => toggleDia(idx)}
                    size="small"
                    sx={{ p: 0, mr: 1 }}
                  />
                  <Typography sx={{ width: 100, fontSize: 14 }}>{dia.label}</Typography>
                  <TextField
                    size="small"
                    value={dia.start}
                    onChange={(e) => updateHora(idx, 'start', e.target.value)}
                    sx={{ width: 70, mx: 1 }}
                    disabled={!dia.enabled}
                  />
                  <Typography sx={{ mx: 0.5 }}>-</Typography>
                  <TextField
                    size="small"
                    value={dia.end}
                    onChange={(e) => updateHora(idx, 'end', e.target.value)}
                    sx={{ width: 70 }}
                    disabled={!dia.enabled}
                  />
                </Box>
              ))}

              <Button variant="contained" sx={{ mt: 2 }} onClick={salvarHorarios}>
                Salvar alterações
              </Button>
            </Paper>
          </Box>
        </Box>
      </Box>
      </Box>
    </Box>
  );
}
