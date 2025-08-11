import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControl,
  FormControlLabel,
  Radio,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ResumoPedido from '../componentes/resumoPedido';
import { useNavigate } from 'react-router-dom';


const ProdutoIndividual = () => {
  const [quantidade, setQuantidade] = useState(1);
  const [produto, setProduto] = useState(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState('pequeno');
  const [guarnicoesSelecionadas, setGuarnicoesSelecionadas] = useState([]);
  const [observacao, setObservacao] = useState("");
  const [quantidadeSacola, setQuantidadeSacola] = useState(0);
  const navigate = useNavigate();


  const { id } = useParams();

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const fetchProduto = async () => {
      try {
        const docRef = doc(db, 'produtos', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduto(docSnap.data());
        }
      } catch (error) {
        console.error('Erro ao buscar produto:', error);
      }
    };

    fetchProduto();

    // Inicia quantidade da sacola
    const sacola = JSON.parse(localStorage.getItem("sacola")) || [];
    const total = sacola.reduce((acc, p) => acc + p.quantidade, 0);
    setQuantidadeSacola(total);

  }, [id]);

  if (!produto) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const preco = parseFloat(produto.precos?.[tamanhoSelecionado] || 0);

  const handleSelecionarGuarnicao = (opcao) => {
    if (guarnicoesSelecionadas.includes(opcao)) {
      setGuarnicoesSelecionadas(guarnicoesSelecionadas.filter((g) => g !== opcao));
    } else {
      if (guarnicoesSelecionadas.length < 2) {
        setGuarnicoesSelecionadas([...guarnicoesSelecionadas, opcao]);
      }
    }
  };

  const handleAdicionarNaSacola = () => {
    const sacola = JSON.parse(localStorage.getItem("sacola")) || [];

    const existente = sacola.find(
      (p) => p.id === produto.id && p.tamanho === tamanhoSelecionado
    );

    if (existente) {
      existente.quantity += quantidade;
    } else {
    sacola.push({
      id: produto.id,               // 🔑 garante ID único
      nome: produto.nome,
      descricao: produto.descricao,
      imagem: produto.imagem,
      tamanho: tamanhoSelecionado,
      precoSelecionado: preco,      // ⚡ salva preço atual!
      guarnicoes: guarnicoesSelecionadas,
      observacao: observacao.trim(),
      quantity: quantidade,
    });
    }

    localStorage.setItem("sacola", JSON.stringify(sacola));

    const novaQuantidade = sacola.reduce((acc, p) => acc + p.quantity, 0);
    setQuantidadeSacola(novaQuantidade);

    const resumoPedido = document.getElementById("resumoPedido");
    if (resumoPedido) resumoPedido.style.bottom = "0";
  };

  return (
    <>
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          bgcolor: 'white',
          overflow: 'hidden',
          fontFamily: 'Poppins, sans-serif',
          boxShadow: 3,
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <img
            src={produto.imagem}
            alt={produto.nome}
            style={{ width: '100%', height: 'auto' }}
          />
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

        <Box sx={{ p: 2 }}>
          <Typography fontSize={24} fontWeight="bold" fontFamily="Poppins, sans-serif">
            {produto.nome}
          </Typography>
          <Typography color="text.secondary" fontSize={16} fontFamily="Poppins, sans-serif">
            {produto.descricao}
          </Typography>

          <Typography fontWeight={600} mt={1.5} mb={2} fontFamily="Poppins, sans-serif">
            Valor: <span style={{ color: '#000' }}>{preco.toFixed(2).replace('.', ',')}</span>
          </Typography>

          <Accordion sx={{ boxShadow: 'none', borderTop: '2px solid #D9D9D9' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight="bold" fontFamily="Poppins, sans-serif">
                  Tamanho do prato
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: '#FF9F0A',
                  px: 1,
                  borderRadius: 1,
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'black',
                  height: 'fit-content',
                }}
              >
                Obrigatório
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl>
                {Object.entries(produto.precos || {}).map(([key, value]) => (
                  <FormControlLabel
                    key={key}
                    value={key}
                    control={
                      <Radio
                        checked={tamanhoSelecionado === key}
                        onChange={(e) => setTamanhoSelecionado(e.target.value)}
                      />
                    }
                    label={`${key.charAt(0).toUpperCase() + key.slice(1)} - R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`}
                    sx={{ fontFamily: 'Poppins, sans-serif' }}
                  />
                ))}
              </FormControl>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ boxShadow: 'none' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight="bold" fontFamily="Poppins, sans-serif">
                  Guarnições
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontFamily: 'Poppins, sans-serif' }}>
                  Selecione até 2 opções
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {produto.guarnicoes.map((opcao, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Radio
                      checked={guarnicoesSelecionadas.includes(opcao)}
                      onChange={() => handleSelecionarGuarnicao(opcao)}
                      sx={{
                        color: '#F75724',
                        '&.Mui-checked': { color: '#F75724' },
                      }}
                    />
                  }
                  label={opcao}
                  sx={{ fontFamily: 'Poppins, sans-serif' }}
                />
              ))}
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ boxShadow: 'none' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight="bold" fontFamily="Poppins, sans-serif">
                Observações
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                fullWidth
                multiline
                placeholder="Escreva aqui sua observação..."
                variant="outlined"
                size="small"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                sx={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </AccordionDetails>
          </Accordion>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 3,
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: '8px',
                backgroundColor: '#fff',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                px: 1,
                height: 40,
              }}
            >
              <IconButton
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                sx={{ color: '#707070', width: 30, height: 30, p: 0 }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography
                sx={{ mx: 1.5, fontWeight: 500, fontSize: 16, fontFamily: 'Poppins, sans-serif' }}
              >
                {quantidade}
              </Typography>
              <IconButton
                onClick={() => setQuantidade(quantidade + 1)}
                sx={{ color: '#F75724', width: 30, height: 30, p: 0 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>

            <Button
              variant="contained"
              onClick={handleAdicionarNaSacola}
              sx={{
                backgroundColor: '#F75724',
                color: 'white',
                textTransform: 'none',
                borderRadius: '8px',
                px: 4,
                py: 1,
                fontWeight: 500,
                fontSize: '14px',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                fontFamily: 'Poppins, sans-serif',
                '&:hover': {
                  backgroundColor: '#e04d1c',
                },
              }}
            >
              Adicionar {(preco * quantidade).toFixed(2).replace('.', ',')}
            </Button>
          </Box>
        </Box>
      </Box>

      <ResumoPedido quantidade={quantidadeSacola} />
    </>
  );
};

export default ProdutoIndividual;
