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
  MenuItem
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

  // Categoria (igual à AddProductModal)
  const [categoria, setCategoria] = useState('');
  const [categorias, setCategorias] = useState([]);

  // Campos fiscais
  const [codigo, setCodigo] = useState('');
  const [ncm, setNcm] = useState('');
  const [cfop, setCfop] = useState('');
  const [cest, setCest] = useState('');
  const [unidade, setUnidade] = useState('');
  const [cEAN, setCEAN] = useState('');
  const [cEANTrib, setCEANTrib] = useState('');
  const [origem, setOrigem] = useState('');
  const [cst_icms, setCstIcms] = useState('');
  const [aliquota_icms, setAliquotaIcms] = useState('');
  const [aliquota_pis, setAliquotaPis] = useState('');
  const [aliquota_cofins, setAliquotaCofins] = useState('');
  const [cst_pis, setCstPis] = useState('');
  const [cst_cofins, setCstCofins] = useState('');

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

      setCodigo(produtoSelecionado.codigo || '');
      setNcm(produtoSelecionado.ncm || '');
      setCfop(produtoSelecionado.cfop || '');
      setCest(produtoSelecionado.cest || '');
      setUnidade(produtoSelecionado.unidade || '');
      setCEAN(produtoSelecionado.cEAN || '');
      setCEANTrib(produtoSelecionado.cEANTrib || '');
      setOrigem(produtoSelecionado.origem ?? '');
      setCstIcms(produtoSelecionado.cst_icms || '');
      setAliquotaIcms(produtoSelecionado.aliquota_icms || '');
      setAliquotaPis(produtoSelecionado.aliquota_pis || '');
      setAliquotaCofins(produtoSelecionado.aliquota_cofins || '');
      setCstPis(produtoSelecionado.cst_pis || '');
      setCstCofins(produtoSelecionado.cst_cofins || '');
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

    const produtoRef = doc(db, 'produtos', produtoSelecionado.id);
    await updateDoc(produtoRef, {
      nome,
      descricao,
      precos,
      status,
      categoria,                 // ✅ igual AddProductModal
      guarnicoes: guarnicoesFinal,
      estoque,
      estoqueMin: estoqueMinimo,
      imagem: finalImageUrl,
      codigo,
      ncm,
      cfop,
      cest,
      unidade,
      origem,
      cst_icms,
      aliquota_icms,
      aliquota_pis,
      aliquota_cofins,
      cst_pis,
      cst_cofins,
      cEAN,
      cEANTrib,
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

        {/* Header igual ao Add */}
        <Paper sx={{ p: 1, pl: 3, mb: 0.2, width: '100%' }}>
          <Typography variant="h6" fontWeight="bold" mb={2} mt={2}>
            Editar produto
          </Typography>
        </Paper>

        {/* Imagem e Nome (match Add) */}
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

        {/* Preços + Categoria + Status */}
        <Paper sx={{ p: 3, mb: 1 }}>
          <Typography fontWeight={500} fontSize={16} mb={2}>Preços / Categoria / Status</Typography>

          {/* Categoria (igual Add) */}
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

          {/* Preços com label acima (igual Add) */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {['pequeno', 'medio', 'grande'].map((size) => (
              <TextField
                key={size}
                value={precos[size] || ''}
                onChange={(e) => setPrecos({ ...precos, [size]: e.target.value })}
                size="small"
                variant="outlined"
                placeholder="R$ 0,00"
                InputProps={{
                  sx: { padding: 0, height: "30px" }
                }}
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

          {/* Status (igual Add) */}
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

        {/* Guarnições (igual Add) */}
        <Paper sx={{ p: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Box>
              <Typography fontWeight={500} fontSize={16}>Adicionar Guarnições</Typography>
              <Typography variant="body2" fontSize="12px" sx={{ color: '#6B7280' }}>Ingredientes, sabores, talheres...</Typography>
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

        {/* Estoque (label acima igual Add) */}
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

        {/* Dados fiscais (igual Add) */}
        <Paper sx={{ p: 2, mb: 1 }}>
          <Typography fontWeight={500} fontSize={16} mb={2}>Dados fiscais NF-e</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}><TextField fullWidth size="small" label="Código" value={codigo} onChange={(e) => setCodigo(e.target.value)} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="NCM" value={ncm} onChange={(e) => setNcm(e.target.value)} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="CFOP" value={cfop} onChange={(e) => setCfop(e.target.value)} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="CEST" value={cest} onChange={(e) => setCest(e.target.value)} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Unidade" value={unidade} onChange={(e) => setUnidade(e.target.value)} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Origem" value={origem} onChange={(e) => setOrigem(e.target.value)} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="CST ICMS" value={cst_icms} onChange={(e) => setCstIcms(e.target.value)} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Alíquota ICMS (%)" value={aliquota_icms} onChange={(e) => setAliquotaIcms(e.target.value)} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="CST PIS" value={cst_pis} onChange={(e) => setCstPis(e.target.value)} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Alíquota PIS (%)" value={aliquota_pis} onChange={(e) => setAliquotaPis(e.target.value)} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="CST COFINS" value={cst_cofins} onChange={(e) => setCstCofins(e.target.value)} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" label="Alíquota COFINS (%)" value={aliquota_cofins} onChange={(e) => setAliquotaCofins(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="cEAN" value={cEAN} onChange={(e) => setCEAN(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="cEANTrib" value={cEANTrib} onChange={(e) => setCEANTrib(e.target.value)} /></Grid>
          </Grid>
        </Paper>

        {/* Footer buttons (igual Add) */}
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
