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
import { doc, updateDoc } from 'firebase/firestore';
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

  // Campos fiscais
  const [codigo, setCodigo] = useState('');
  const [ncm, setNcm] = useState('');
  const [cfop, setCfop] = useState('');
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

  useEffect(() => {
    if (produtoSelecionado) {
      setNome(produtoSelecionado.nome || '');
      setDescricao(produtoSelecionado.descricao || '');
      setPrecos(produtoSelecionado.precos || { pequeno: '', medio: '', grande: '' });
      setStatus(produtoSelecionado.status || 'Disponível');
      setGuarnicoes(produtoSelecionado.guarnicoes || []);
      setEstoque(produtoSelecionado.estoque || '');
      setEstoqueMinimo(produtoSelecionado.estoqueMinimo || '');
      setImageUrl(produtoSelecionado.imagem || '');
      setCodigo(produtoSelecionado.codigo || '');
      setNcm(produtoSelecionado.ncm || '');
      setCfop(produtoSelecionado.cfop || '');
      setUnidade(produtoSelecionado.unidade || '');
      setCEAN(produtoSelecionado.cEAN || '');
      setCEANTrib(produtoSelecionado.cEANTrib || '');
      setOrigem(produtoSelecionado.origem || '');
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

  const handleSalvar = async () => {
    let finalImageUrl = produtoSelecionado?.imagem;
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

    const produtoRef = doc(db, 'produtos', produtoSelecionado.id);
    await updateDoc(produtoRef, {
      nome,
      descricao,
      precos,
      status,
      guarnicoes,
      estoque,
      estoqueMinimo,
      imagem: finalImageUrl,
      codigo,
      ncm,
      cfop,
      unidade,
      cEAN,
      cEANTrib,
      origem,
      cst_icms,
      aliquota_icms,
      aliquota_pis,
      aliquota_cofins,
      cst_pis,
      cst_cofins
    });

    alert('Produto atualizado com sucesso!');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%', maxWidth: 800, maxHeight: '90vh',
        bgcolor: 'white', p: 4, overflowY: 'auto', borderRadius: 2
      }}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 16, right: 16 }}>
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" fontWeight="bold" mb={2}>Editar produto</Typography>

        {/* Imagem e informações básicas */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", gap: 5 }}>
            <Grid item xs={4}>
              <Box sx={{
                position: 'relative', width: '200px', aspectRatio: '1 / 1',
                borderRadius: 2, overflow: 'hidden'
              }}>
                <img src={imageUrl} alt="Produto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <IconButton component="label" sx={{
                  position: 'absolute', bottom: 8, right: 8, backgroundColor: '#FFF', border: '1px solid #DDD'
                }}>
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
          <Box sx={{ display: 'flex', gap: 2 }}>
            {['pequeno', 'medio', 'grande'].map((size) => (
              <TextField key={size} label={`Preço ${size}`} value={precos[size] || ''} onChange={(e) => setPrecos({ ...precos, [size]: e.target.value })} size="small" />
            ))}
          </Box>
          <Button variant="contained" onClick={handleStatusClick} sx={{ mt: 2, bgcolor: '#00B856' }}>
            {status} <img src={arrowDown} style={{ marginLeft: '8px' }} alt="Arrow" />
          </Button>
          <Menu anchorEl={anchorElStatus} open={openStatus} onClose={() => handleStatusClose()}>
            {['Disponível', 'Indisponível', 'Sem estoque'].map((option) => (
              <MenuItem key={option} onClick={() => handleStatusClose(option)}>{option}</MenuItem>
            ))}
          </Menu>
        </Paper>

        {/* Dados fiscais */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight="bold" mb={2}>Dados fiscais</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth label="Código do produto" value={codigo} onChange={(e) => setCodigo(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="NCM" value={ncm} onChange={(e) => setNcm(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="CFOP" value={cfop} onChange={(e) => setCfop(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Unidade comercial" value={unidade} onChange={(e) => setUnidade(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Código EAN" value={cEAN} onChange={(e) => setCEAN(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Código EAN Tributável" value={cEANTrib} onChange={(e) => setCEANTrib(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Origem" value={origem} onChange={(e) => setOrigem(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="CST ICMS" value={cst_icms} onChange={(e) => setCstIcms(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Alíquota ICMS (%)" value={aliquota_icms} onChange={(e) => setAliquotaIcms(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Alíquota PIS (%)" value={aliquota_pis} onChange={(e) => setAliquotaPis(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Alíquota COFINS (%)" value={aliquota_cofins} onChange={(e) => setAliquotaCofins(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="CST PIS" value={cst_pis} onChange={(e) => setCstPis(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="CST COFINS" value={cst_cofins} onChange={(e) => setCstCofins(e.target.value)} /></Grid>
          </Grid>
        </Paper>

        {/* Estoque */}
        <Paper sx={{ p: 2 }}>
          <Typography fontWeight="bold" mb={2}>Controle de estoque</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth label="Estoque" value={estoque} onChange={(e) => setEstoque(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Estoque mínimo" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} /></Grid>
          </Grid>
        </Paper>

        <Button variant="contained" sx={{ mt: 3, bgcolor: '#00B856' }} onClick={handleSalvar}>Salvar alterações</Button>
      </Box>
    </Modal>
  );
}
