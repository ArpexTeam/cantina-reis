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
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function AddProductModal({ open, onClose, onProdutoAdicionado }) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precos, setPrecos] = useState({ pequeno: '', medio: '', grande: '' });
  const [status, setStatus] = useState('Disponível');
  const [guarnicoes, setGuarnicoes] = useState([]);
  const [estoque, setEstoque] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Campos fiscais
  const [codigo, setCodigo] = useState('');
  const [ncm, setNcm] = useState('');
  const [cfop, setCfop] = useState('');
  const [cest, setCest] = useState('');
  const [unidade, setUnidade] = useState('');
  const [origem, setOrigem] = useState(0);
  const [cst_icms, setCstIcms] = useState('');
  const [aliquota_icms, setAliquotaIcms] = useState('');
  const [cst_pis, setCstPis] = useState('');
  const [aliquota_pis, setAliquotaPis] = useState('');
  const [cst_cofins, setCstCofins] = useState('');
  const [aliquota_cofins, setAliquotaCofins] = useState('');
  const [cEAN, setCEAN] = useState('SEM GTIN');
  const [cEANTrib, setCEANTrib] = useState('SEM GTIN');

  const [anchorElStatus, setAnchorElStatus] = useState(null);
  const openStatus = Boolean(anchorElStatus);

  const [editingGuarnicaoIndex, setEditingGuarnicaoIndex] = useState(null);
  const [guarnicaoInput, setGuarnicaoInput] = useState('');
  const [addingGuarnicao, setAddingGuarnicao] = useState(false);

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const resetForm = () => {
    setNome('');
    setDescricao('');
    setPrecos({ pequeno: '', medio: '', grande: '' });
    setStatus('Disponível');
    setGuarnicoes([]);
    setEstoque('');
    setEstoqueMinimo('');
    setImageUrl('');
    setSelectedFile(null);
    setEditingGuarnicaoIndex(null);
    setGuarnicaoInput('');
    setAddingGuarnicao(false);

    // Fiscais
    setCodigo('');
    setNcm('');
    setCfop('');
    setCest('');
    setUnidade('');
    setOrigem(0);
    setCstIcms('');
    setAliquotaIcms('');
    setCstPis('');
    setAliquotaPis('');
    setCstCofins('');
    setAliquotaCofins('');
    setCEAN('SEM GTIN');
    setCEANTrib('SEM GTIN');
  };

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

  const handleStartAddGuarnicao = () => {
    setAddingGuarnicao(true);
    setGuarnicaoInput('');
    setEditingGuarnicaoIndex(null);
  };

  const handleStartEditGuarnicao = (index) => {
    setEditingGuarnicaoIndex(index);
    setGuarnicaoInput(guarnicoes[index]);
    setAddingGuarnicao(false);
  };

  const handleSaveAddGuarnicao = () => {
    if (guarnicaoInput.trim() === '') return;
    setGuarnicoes([...guarnicoes, guarnicaoInput.trim()]);
    setGuarnicaoInput('');
    setAddingGuarnicao(false);
  };

  const handleSaveEditGuarnicao = () => {
    if (guarnicaoInput.trim() === '') return;
    const novas = [...guarnicoes];
    novas[editingGuarnicaoIndex] = guarnicaoInput.trim();
    setGuarnicoes(novas);
    setGuarnicaoInput('');
    setEditingGuarnicaoIndex(null);
  };

  const handleRemoveGuarnicao = (index) => {
    setGuarnicoes(guarnicoes.filter((_, i) => i !== index));
  };

  const handleSalvar = async () => {
    try {
      let finalImageUrl = '';

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('upload_preset', 'cantina-preset');

        const res = await fetch(`https://api.cloudinary.com/v1_1/dv7wvwxxs/image/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        finalImageUrl = data.secure_url;
      }

      const novoProduto = {
        nome,
        descricao,
        precos,
        status,
        guarnicoes,
        estoque,
        estoqueMin: estoqueMinimo,
        imagem: finalImageUrl,
        codigo,
        ncm,
        cfop,
        cest,
        unidade,
        origem: Number(origem),
        cst_icms,
        aliquota_icms,
        cst_pis,
        aliquota_pis,
        cst_cofins,
        aliquota_cofins,
        cEAN,
        cEANTrib
      };

      const docRef = await addDoc(collection(db, 'produtos'), novoProduto);

      if (typeof onProdutoAdicionado === 'function') {
        onProdutoAdicionado({ ...novoProduto, id: docRef.id });
      }

      alert('Produto adicionado com sucesso!');
      resetForm();
      onClose();

    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 900, maxHeight: '90vh', bgcolor: 'white', p: 4, overflowY: 'auto', borderRadius: 2 }}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 16, right: 16 }}>
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" fontWeight="bold" mb={2}>
          Adicionar novo produto
        </Typography>

        {/* Imagem e Nome */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", gap: 5 }}>
            <Grid item xs={4}>
              <Box sx={{ position: 'relative', width: '200px', aspectRatio: '1 / 1', borderRadius: 2, overflow: 'hidden' }}>
                {imageUrl && <img src={imageUrl} alt="Produto" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />}
                <IconButton component="label" sx={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: '#FFF', border: '1px solid #DDD', '&:hover': { backgroundColor: '#f0f0f0' } }}>
                  <CameraAltIcon />
                  <input type="file" accept="image/*" hidden onChange={handleImageSelect} />
                </IconButton>
              </Box>
            </Grid>
            <Grid item xs={8}>
              <TextField fullWidth label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth label="Descrição" multiline rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </Grid>
          </Box>
        </Paper>

        {/* Preços */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight="bold" mb={2}>Preços</Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            {['pequeno', 'medio', 'grande'].map((size) => (
              <TextField key={size} label={`Preço ${size}`} value={precos[size] || ''} onChange={(e) => setPrecos({ ...precos, [size]: e.target.value })} size="small" sx={{ width: '200px' }} />
            ))}
          </Box>
          <Button variant="contained" onClick={handleStatusClick} sx={{ mt: 2, bgcolor: '#00B856', textTransform: 'none', borderRadius: '4px' }}>
            {status}
            <img src={arrowDown} style={{ marginLeft: '8px' }} alt="Arrow" />
          </Button>
          <Menu anchorEl={anchorElStatus} open={openStatus} onClose={() => handleStatusClose()}>
            {['Disponível', 'Indisponível', 'Sem estoque'].map((option) => (
              <MenuItem key={option} onClick={() => handleStatusClose(option)}>{option}</MenuItem>
            ))}
          </Menu>
        </Paper>

        {/* Guarnições */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Box>
              <Typography fontWeight={700}>Guarnições</Typography>
              <Typography variant="body2" fontSize="12px" sx={{ color: '#6B7280' }}>Ingredientes, sabores, talheres...</Typography>
            </Box>
            <Button variant="outlined" sx={{ minWidth: '32px', height: '32px', borderColor: '#F75724', color: '#F75724' }} onClick={handleStartAddGuarnicao}>
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

        {/* Estoque */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight="bold" mb={2}>Controle de estoque</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Estoque" value={estoque} onChange={(e) => setEstoque(e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Estoque mínimo" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} />
            </Grid>
          </Grid>
        </Paper>

        {/* Campos fiscais */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight="bold" mb={2}>Dados fiscais NF-e</Typography>
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

        <Button variant="contained" sx={{ mt: 3, bgcolor: '#00B856' }} onClick={handleSalvar}>
          Adicionar produto
        </Button>
      </Box>
    </Modal>
  );
}
