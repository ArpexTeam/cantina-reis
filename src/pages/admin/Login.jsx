import React, { useState, useContext } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
} from '@mui/material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase'; // ajuste pro seu config
import bcrypt from 'bcryptjs';
import { AuthContext } from '../../AuthContext'; // ajuste se seu caminho for diferente
import { useNavigate } from 'react-router-dom';

import logo from '../../img/ChatGPT Image 23 de abr. de 2025, 20_03_44 (1) 2.svg';
import backgroundImg from '../../../src/img/cenoura-plana-brocolis-leigos-e-sopa-fusilli-em-tigela-com-pao-e-colher-de-pau-com-espaco-de-copia 1.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  

  const handleLogin = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const hashSalvo = userData.senha;

        const match = bcrypt.compareSync(senha, hashSalvo);

        if (match) {
          login(rememberMe);
          alert('Login realizado com sucesso!');
          navigate('/admin'); // ou dashboard
        } else {
          alert('Senha incorreta!');
        }
      } else {
        alert('Usuário não encontrado!');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      alert('Erro ao tentar fazer login.');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* Lado esquerdo */}
      <Box
        sx={{
          flex: { xs: '1 1 100%', md: '1 1 40%' },
          bgcolor: '#000',
          color: '#FFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 6,
        }}
      >
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <img
            src={logo}
            alt="Logo Cantina Reis"
            style={{
              maxWidth: '250px',
              display: 'block',
              margin: '0 auto',
            }}
          />
        </Box>

        <Box component="form" noValidate sx={{ width: '100%', maxWidth: '400px' }}>
          <Typography sx={{ mb: 1, fontWeight: 500 }}>E-mail</Typography>
          <TextField
            fullWidth
            placeholder="name@example.com"
            variant="filled"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              disableUnderline: true,
              sx: {
                bgcolor: '#FFF',
                borderRadius: 1,
                height: 48,
                fontFamily: 'Poppins, sans-serif',
                '&:hover': { bgcolor: '#FFF' },
                '&.Mui-focused': { bgcolor: '#FFF' },
                '&:before, &:after': { borderBottom: 'none' },
                input: {
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  padding: 1,
                },
              },
            }}
            sx={{ mb: 3 }}
          />

          <Typography sx={{ mb: 1, fontWeight: 500 }}>Senha</Typography>
          <TextField
            fullWidth
            type="password"
            placeholder="********"
            variant="filled"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            InputProps={{
              disableUnderline: true,
              sx: {
                bgcolor: '#FFF',
                borderRadius: 1,
                height: 48,
                fontFamily: 'Poppins, sans-serif',
                '&:hover': { bgcolor: '#FFF' },
                '&.Mui-focused': { bgcolor: '#FFF' },
                '&:before, &:after': { borderBottom: 'none' },
                input: {
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  padding: 1,
                },
              },
            }}
            sx={{ mb: 2 }}
          />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: '#FFF',
                    '&.Mui-checked': {
                      color: '#F75724',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: 14, color: '#FFF' }}>
                  Lembre-me
                </Typography>
              }
            />
            <Link href="#" sx={{ fontSize: 14, color: '#FFF' }}>
              Esqueceu a senha?
            </Link>
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            sx={{
              bgcolor: '#F75724',
              textTransform: 'none',
              fontWeight: 600,
              py: 1.5,
              borderRadius: 1,
              fontFamily: 'Poppins, sans-serif',
              '&:hover': {
                bgcolor: '#e64c1a',
              },
            }}
          >
            Entrar
          </Button>
        </Box>
      </Box>

      {/* Lado direito */}
      <Box
        sx={{
          flex: { xs: '0 0 0%', md: '1 1 60%' },
          display: { xs: 'none', md: 'block' },
          height: '100vh',
          backgroundImage: `url('${backgroundImg}')`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />
    </Box>
  );
}
