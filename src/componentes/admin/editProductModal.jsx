// src/componentes/admin/EditProductModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Modal,
  Paper,
  Grid,
  TextField,
  IconButton,
  Button,
  Menu,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import arrowDown from '../../img/fill-arrow-down.svg';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function EditProductModal({ open, onClose, produtoSelecionado }) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precos, setPrecos] = useState({ pequeno: '', medio: '', grande: '' });
  const [status, setStatus] = useState('Disponível');
  const [guarnicoes, setGuarnicoes] = useState([]);
  const [estoque, setEstoque] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Categoria
  const [categoria, setCategoria] = useState('');
  const [categorias, setCategorias] = useState([]);

  // Config dinâmica (sem tamanhoObrigatorio)
  const [config, setConfig] = useState({
    habilitarTamanhos: false,
    habilitarGuarnicoes: false,
    maxGuarnicoes: 2,
  });

  const [anchorElStatus, setAnchorElStatus] = useState(null);
  const openStatus = Boolean(anchorElStatus);

  const [editingGuarnicaoIndex, setEditingGuarnicaoIndex] = useState(null);
  const [guarnicaoInput, setGuarnicaoInput] = useState('');
  const [addingGuarnicao, setAddingGuarnicao] = useState(false);

  // Carrega categorias para o select
  useEffect(() => {
    const fetchCategorias = async () => {
      const snap = await getDocs(collection(db, 'categorias'));
      const list = snap.docs.map(d => d.data()?.nome).filter(Boolean);
      list.sort((a, b) => String(a).localeCompare(String(b)));
      setCategorias(list);
    };
    if (open) fetchCategorias().catch(() => {});
  }, [open]);

  useEffect(() => {
    if (produtoSelecionado) {
      setNome(produtoSelecionado.nome || '');
      setDescricao(produtoSelecionado.descricao || '');
      setPrecos(produtoSelecionado.precos || { pequeno: '', medio: '', grande: '' });
      setStatus(produtoSelecionado.status || 'Disponível');

      setGuarnicoes(Array.isArray(produtoSelecionado.guarnicoes) ? produtoSelecionado.guarnicoes : []);

      setEstoque(produtoSelecionado.estoque || '');
      setEstoqueMinimo(produtoSelecionado.estoqueMin || '');

      setImageUrl(produtoSelecionado.imagem || '');
      setCategoria(produtoSelecionado.categoria || '');

      // carrega config (com fallback inteligente)
      const precoKeys = Object.keys(produtoSelecionado.precos || {});
      const cfg = produtoSelecionado.config || {};
      setConfig({
        habilitarTamanhos: cfg.habilitarTamanhos ?? (precoKeys.length > 1),
        habilitarGuarnicoes:
          cfg.habilitarGuarnicoes ??
          (Array.isArray(produtoSelecionado.guarnicoes) && produtoSelecionado.guarnicoes.length > 0),
        maxGuarnicoes: Number(cfg.maxGuarnicoes ?? 2),
      });
    }
  }, [produtoSelecionado]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setSelectedFile(file);
  };

  const handleStatusClick = (event) => setAnchorElStatus(event.currentTarget);
  const handleStatusClose = (value) => {
    if (value) setStatus(value);
    setAnchorElStatus(null);
  };

  const handleStartAddGuarnicao = () => { setAddingGuarnicao(true); setGuarnicaoInput(''); setEditingGuarnicaoIndex(null); };
  const handleStartEditGuarnicao = (i) => { setEditingGuarnicaoIndex(i); setGuarnicaoInput(guarnicoes[i]); setAddingGuarnicao(false); };
  const handleSaveAddGuarnicao = () => {
    if (!guarnicaoInput.trim()) return;
    setGuarnicoes(prev => [...prev, guarnicaoInput.trim()]);
    setGuarnicaoInput(''); setAddingGuarnicao(false);
  };
  const handleSaveEditGuarnicao = () => {
    if (!guarnicaoInput.trim()) return;
    setGuarnicoes(prev => prev.map((g, i) => i === editingGuarnicaoIndex ? guarnicaoInput.trim() : g));
    setGuarnicaoInput(''); setEditingGuarnicaoIndex(null);
  };
  const handleRemoveGuarnicao = (i) => setGuarnicoes(prev => prev.filter((_, idx) => idx !== i));

  const handleSalvar = async () => {
    // consolida guarnição pendente
    let lista = [...guarnicoes];
    if (addingGuarnicao && guarnicaoInput.trim()) lista.push(guarnicaoInput.trim());
    if (editingGuarnicaoIndex !== null && guarnicaoInput.trim()) {
      lista[editingGuarnicaoIndex] = guarnicaoInput.trim();
    }
    const guarnicoesFinal = Array.from(new Set(lista.map(g => String(g).trim()).filter(Boolean)));

    let finalImageUrl = produtoSelecionado?.imagem;
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', 'cantina-preset');
      const res = await fetch(`https://api.cloudinary.com/v1_1/dv7wvwxxs/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      finalImageUrl = data.secure_url;
    }

    // monta precos conforme config
    const precosFinal = config.habilitarTamanhos
      ? {
          pequeno: precos.pequeno || '',
          medio: precos.medio || '',
          grande: precos.grande || '',
        }
      : { pequeno: precos.pequeno || '' }; // "preço único" salvo em pequeno

    const produtoRef = doc(db, 'produtos', produtoSelecionado.id);
    await updateDoc(produtoRef, {
      nome,
      descricao,
      precos: precosFinal,
      status,
      categoria,
      guarnicoes: guarnicoesFinal,
      estoque,
      estoqueMin: estoqueMinimo,
      imagem: finalImageUrl,
      config: {
        habilitarTamanhos: !!config.habilitarTamanhos,
        habilitarGuarnicoes: !!config.habilitarGuarnicoes,
        maxGuarnicoes: Number(config.maxGuarnicoes ?? 2),
      },
      // ❌ Sem campos fiscais
    });

    alert('Produto atualizado com sucesso!');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%', maxWidth: 900, maxHeight: '90vh',
          bgcolor: '#F2F2F2', overflowY: 'auto', borderRadius: 2
        }}
      >
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 16, right: 16 }}>
          <CloseIcon />
        </IconButton>

        {/* Header */}
        <Paper sx={{ p: 1, pl: 3, mb: 0.2, width: '100%' }}>
          <Typography variant="h6" fontWeight="bold" mb={2} mt={2}>
            Editar produto
          </Typography>
        </Paper>

        {/* Imagem e Nome */}
        <Paper sx={{ p: 3, mb: 1, width: '100%' }}>
          <Box sx={{ display: "flex", gap: 5 }}>
            <Grid item xs={4}>
              <Box
                sx={{
                  position: 'relative',
                  width: 200,
                  aspectRatio: '1 / 1',
                  borderRadius: 2,
                  border: '1px solid #E5E7EB',
                  bgcolor: imageUrl ? 'transparent' : '#F9FAFB',
                  transition: 'border-color .15s ease',
                  '&:hover': { borderColor: '#D1D5DB' },
                }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Produto"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: -11,
                    right: -11,
                    backgroundColor: '#FFF',
                    border: '1px solid #DDD',
                    '&:hover': { backgroundColor: '#f0f0f0' },
                  }}
                >
                  <CameraAltIcon sx={{ color: '#F24822' }} />
                  <input type="file" accept="image/*" hidden onChange={handleImageSelect} />
                </IconButton>
              </Box>
            </Grid>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </Grid>
          </Box>
        </Paper>

        {/* Configurações dinâmicas */}
        <Paper sx={{ p: 3, mb: 1 }}>
          <Typography fontWeight={600} fontSize={16} mb={1.5}>Configurações do produto</Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.habilitarTamanhos}
                  onChange={(_, checked) => setConfig(c => ({ ...c, habilitarTamanhos: checked }))}
                />
              }
              label="Habilitar tamanhos (P/M/G)"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={config.habilitarGuarnicoes}
                  onChange={(_, checked) => setConfig(c => ({ ...c, habilitarGuarnicoes: checked }))}
                />
              }
              label="Habilitar guarnições"
            />

            <TextField
              type="number"
              label="Máx. guarnições"
              size="small"
              inputProps={{ min: 0 }}
              value={config.maxGuarnicoes}
              onChange={(e) => setConfig(c => ({ ...c, maxGuarnicoes: Math.max(0, Number(e.target.value || 0)) }))}
              disabled={!config.habilitarGuarnicoes}
            />
          </Box>
        </Paper>

        {/* Preços + Categoria + Status */}
        <Paper sx={{ p: 3, mb: 1 }}>
          <Typography fontWeight={500} fontSize={16} mb={2}>Preços / Categoria / Status</Typography>

          {/* Categoria */}
          <Box sx={{ mb: 2, maxWidth: 320 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              helperText={categorias.length ? '' : 'Nenhuma categoria cadastrada'}
            >
              {categorias.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Preços (dinâmico) */}
          {config.habilitarTamanhos ? (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {['pequeno', 'medio', 'grande'].map((size) => (
                <TextField
                  key={size}
                  value={precos[size] || ''}
                  onChange={(e) => setPrecos({ ...precos, [size]: e.target.value })}
                  size="small"
                  variant="outlined"
                  placeholder="R$ 0,00"
                  InputProps={{ sx: { padding:0, height:"30px" } }}
                  InputLabelProps={{
                    shrink: true,
                    sx: {
                      position: 'relative',
                      transform: 'none',
                      mb: 0.5,
                      fontSize: 12,
                      color: '#6B7280',
                      fontWeight: 500,
                    },
                  }}
                  label={`Preço ${size}`}
                  sx={{
                    width: 150,
                    '& .MuiOutlinedInput-root': { mt: 0.5 },
                    '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' },
                  }}
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ maxWidth: 200 }}>
              <TextField
                value={precos.pequeno || ''}
                onChange={(e) => setPrecos({ ...precos, pequeno: e.target.value })}
                size="small"
                variant="outlined"
                placeholder="R$ 0,00"
                InputProps={{ sx: { padding:0, height:"30px" } }}
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    position: 'relative',
                    transform: 'none',
                    mb: 0.5,
                    fontSize: 12,
                    color: '#6B7280',
                    fontWeight: 500,
                  },
                }}
                label="Preço único"
                sx={{
                  '& .MuiOutlinedInput-root': { mt: 0.5 },
                  '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' },
                }}
              />
            </Box>
          )}

          {/* Status */}
          <Button
            variant="contained"
            onClick={handleStatusClick}
            sx={{ mt: 2, bgcolor: '#00B856', textTransform: 'none', borderRadius: '6px', px: 2, py: 0.3 }}
          >
            {status}
            <img src={arrowDown} style={{ marginLeft: '8px' }} alt="Arrow" />
          </Button>
          <Menu anchorEl={anchorElStatus} open={openStatus} onClose={() => handleStatusClose()}>
            {['Disponível', 'Indisponível', 'Sem estoque'].map((option) => (
              <MenuItem key={option} onClick={() => handleStatusClose(option)}>{option}</MenuItem>
            ))}
          </Menu>
        </Paper>

        {/* Guarnições (só quando habilitado) */}
        {config.habilitarGuarnicoes && (
          <Paper sx={{ p: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Box>
                <Typography fontWeight={500} fontSize={16}>Adicionar Guarnições</Typography>
                <Typography variant="body2" fontSize="12px" sx={{ color: '#6B7280' }}>
                  {`Cliente poderá escolher até ${config.maxGuarnicoes} opção(ões).`}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                sx={{ minWidth: '32px', height: '42px', borderColor: '#F75724', color: '#F75724' }}
                onClick={handleStartAddGuarnicao}
              >
                <AddIcon sx={{ fontSize: '20px' }} />
              </Button>
            </Box>

            {guarnicoes.map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #E5E7EB', py: 1, gap: 1 }}>
                {editingGuarnicaoIndex === i ? (
                  <>
                    <TextField size="small" value={guarnicaoInput} onChange={(e) => setGuarnicaoInput(e.target.value)} sx={{ flexGrow: 1 }} />
                    <Button variant="contained" sx={{ bgcolor: '#00B856' }} onClick={handleSaveEditGuarnicao}>Salvar</Button>
                    <Button variant="outlined" onClick={() => { setEditingGuarnicaoIndex(null); setGuarnicaoInput(''); }}>Cancelar</Button>
                  </>
                ) : (
                  <>
                    <Typography sx={{ flexGrow: 1 }}>{item}</Typography>
                    <IconButton size="small" onClick={() => handleStartEditGuarnicao(i)}><EditIcon sx={{ fontSize: 18 }} /></IconButton>
                    <IconButton size="small" onClick={() => handleRemoveGuarnicao(i)}><DeleteIcon sx={{ fontSize: 20, color: '#9B1C1C' }} /></IconButton>
                  </>
                )}
              </Box>
            ))}

            {addingGuarnicao && (
              <Box sx={{ display: 'flex', gap: 1, py: 1 }}>
                <TextField size="small" value={guarnicaoInput} onChange={(e) => setGuarnicaoInput(e.target.value)} placeholder="Nova guarnição" sx={{ flexGrow: 1 }} />
                <Button variant="contained" sx={{ bgcolor: '#F75724' }} onClick={handleSaveAddGuarnicao}>Salvar</Button>
                <Button variant="outlined" onClick={() => { setAddingGuarnicao(false); setGuarnicaoInput(''); }}>Cancelar</Button>
              </Box>
            )}
          </Paper>
        )}

        {/* Estoque */}
        <Paper sx={{ p: 2, mb: 1 }}>
          <Typography fontWeight={500} fontSize={16} mb={2}>Controle de estoque</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                label="Estoque"
                value={estoque}
                onChange={(e) => setEstoque(e.target.value)}
                InputProps={{ sx: { padding: 0, height: "30px" } }}
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    position: 'relative',
                    transform: 'none',
                    mb: 0.5,
                    fontSize: 12,
                    color: '#6B7280',
                    fontWeight: 600,
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { mt: 0.5 },
                  '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                label="Estoque mínimo"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
                InputProps={{ sx: { padding: 0, height: "30px" } }}
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    position: 'relative',
                    transform: 'none',
                    mb: 0.5,
                    fontSize: 12,
                    color: '#6B7280',
                    fontWeight: 600,
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { mt: 0.5 },
                  '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' },
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Footer buttons */}
        <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            sx={{ textTransform: 'capitalize', fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 14, mt: 3, bgcolor: '#F75724', py: 1, px: 5 }}
            onClick={handleSalvar}
          >
            Confirmar
          </Button>
          <Button
            variant="contained"
            sx={{ textTransform: 'capitalize', fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 14, mt: 3, border: '2px solid #F75724', color: '#F75724', bgcolor: 'transparent', py: 1, px: 5 }}
            onClick={onClose}
          >
            Cancelar
          </Button>
        </Paper>
      </Box>
    </Modal>
  );
}
