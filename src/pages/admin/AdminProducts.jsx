import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Avatar, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Button, IconButton, TextField, Menu, MenuItem, Modal, Backdrop, Fade
} from '@mui/material';
import Sidebar from '../../componentes/admin/sidebar';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import logo from '../../img/ChatGPT Image 23 de abr. de 2025, 20_03_44 (1) 2.svg';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import EditProductModal from '../../componentes/admin/editProductModal';
import pen from '../../img/penIcon.svg';
import trash from '../../img/trashIcon.svg';

// >>> Firestore (tempo real + delete)
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../../firebase';

import AddProductModal from '../../componentes/admin/addProductModal';

export default function AdminProducts() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [modalOpen, setModalOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deletingId, setDeletingId] = useState(null);


  const handleEditClick = (produto) => {
    setProdutoSelecionado(produto);
    setModalOpen(true);
  };

  // Mantive compat: quando o modal de adicionar chamar, já injeta no estado.
  // Com onSnapshot isso não é necessário, mas não atrapalha.
  const handleProdutoAdicionado = (produtoComId) => {
    setProdutos((prev) => [...prev, produtoComId]);
  };

  // ======= Tempo real: produtos + categorias =======
  useEffect(() => {
    // Produtos (ordena por nome para consistência visual)
    const unsubProdutos = onSnapshot(collection(db, 'produtos'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Ordena por nome (se existir)
      list.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));
      setProdutos(list);
    }, (err) => console.error('onSnapshot produtos:', err));

    // Categorias
    const unsubCategorias = onSnapshot(collection(db, 'categorias'), (snap) => {
      const list = snap.docs.map((d) => d.data()?.nome).filter(Boolean);
      // ordena alfabeticamente
      list.sort((a, b) => a.localeCompare(b));
      setCategorias(list);
    }, (err) => console.error('onSnapshot categorias:', err));

    return () => {
      unsubProdutos?.();
      unsubCategorias?.();
    };
  }, []);

  const handleAddCategoria = async () => {
    if (newCategoryName.trim() === '') return;

    try {
      await addDoc(collection(db, 'categorias'), { nome: newCategoryName.trim() });
      setNewCategoryName('');
      setAddCategoryModalOpen(false);
      // onSnapshot atualiza a UI sozinho
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
    }
  };

const handleDelete = async (id, nome) => {
  if (!id) return;
  const ok = window.confirm(`Excluir o produto "${nome ?? 'sem nome'}"?`);
  if (!ok) return;

  try {
    setDeletingId(id);
    await deleteDoc(doc(db, 'produtos', String(id)));
    // onSnapshot atualiza a tabela automaticamente
  } catch (e) {
    console.error('Erro ao excluir produto:', e);
    // Mostra mensagem mais clara (muito comum: regras do Firestore)
    alert(e?.message || 'Falha ao excluir o produto.');
  } finally {
    setDeletingId(null);
  }
};

  const calcularStatusEstoque = (estoque, estoqueMinimo) => {
    const est = Number(estoque ?? 0);
    const min = Number(estoqueMinimo ?? 0);
    if (est <= 0) return 'Acabou';
    if (!Number.isNaN(min) && est <= min) return 'Baixo';
    return 'Acima';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Acima': return '#DEF7EC';
      case 'Baixo': return '#FDF6B2';
      case 'Acabou': return '#FDE8E8';
      default: return '#E0E0E0';
    }
  };

  const getStatusFontColor = (status) => {
    switch (status) {
      case 'Acima': return '#03543F';
      case 'Baixo': return '#723B13';
      case 'Acabou': return '#9B1C1C';
      default: return '#000000';
    }
  };

  // Filtro/pesquisa
  const produtosFiltrados = produtos.filter((p) => {
    const searchMatch = Object.values(p).some((v) =>
      typeof v === 'string' && v.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const categoriaMatch = categoriaSelecionada ? p.categoria === categoriaSelecionada : true;
    return searchMatch && categoriaMatch;
  });

  const totalPages = Math.ceil(produtosFiltrados.length / itemsPerPage) || 1;
  const current = Math.min(currentPage, totalPages); // evita ficar em página inválida após updates
  const produtosExibidos = produtosFiltrados.slice(
    (current - 1) * itemsPerPage,
    current * itemsPerPage
  );

  const handleClickCategorias = (event) => setAnchorEl(event.currentTarget);
  const handleCloseCategorias = () => setAnchorEl(null);
  const handleSelectCategoria = (cat) => {
    setCategoriaSelecionada(cat);
    setCurrentPage(1);
    handleCloseCategorias();
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, bgcolor: '#F8F8F8' }}>
        {/* Header */}
        <Box sx={{
          width: '100%', height: 80, px: 4, backgroundColor: '#000',
          color: '#FFF', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', boxSizing: 'border-box', position: 'absolute',
          left: 0, zIndex: 10
        }}>
          <Box sx={{ height: 70, width: 'auto' }}>
            <img src={logo} alt="Logo" style={{ width: '100%', height: '100%' }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
            <Avatar src="https://via.placeholder.com/150" />
            <Typography component="span" sx={{ display: 'inline-flex' }}>
              Administrador
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 4, mt: 10 }}>
          <Typography variant="h6" fontWeight="bold" textAlign="center">Página de produtos</Typography>
          <Box sx={{ borderBottom: '2px solid black', width: '100%', mt: 1, mb: 4 }} />

          {/* Barra de busca */}
          <Box sx={{ display: 'flex', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<MenuIcon />}
              onClick={handleClickCategorias}
              sx={{
                bgcolor: '#F75724',
                textTransform: 'none',
                mr: 2,
                borderRadius: '4px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 500,
              }}
            >
              Categorias
            </Button>

            <Menu anchorEl={anchorEl} open={open} onClose={handleCloseCategorias}>
              <MenuItem onClick={() => {
                handleCloseCategorias();
                setAddCategoryModalOpen(true);
              }} sx={{ color: '#F75724' }}>
                ➕ Adicionar nova categoria
              </MenuItem>
              {categorias.map((cat, idx) => (
                <MenuItem
                  key={idx}
                  onClick={() => handleSelectCategoria(cat)}
                  sx={{
                    bgcolor: cat === categoriaSelecionada ? '#FFE0DB' : '#FFF',
                    fontWeight: cat === categoriaSelecionada ? 700 : 400,
                  }}
                >
                  {cat}
                </MenuItem>
              ))}
            </Menu>

            <TextField
              placeholder="Search"
              size="small"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              sx={{
                maxWidth: '40%',
                flex: 1,
                bgcolor: '#fff',
                borderRadius: '6px',
                '& .MuiOutlinedInput-root': { fontFamily: 'Poppins, sans-serif' },
              }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: '#9CA3AF', mr: 1 }} fontSize="small" />
                ),
                sx: { height: '40px', pl: 1 },
              }}
            />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                bgcolor: '#F75724',
                textTransform: 'none',
                ml: 'auto',
                borderRadius: '4px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 500,
                '&:hover': { bgcolor: '#e64c1a' },
              }}
              onClick={() => setAddProductModalOpen(true)}
            >
              Adicionar produto
            </Button>
          </Box>

          {/* Tabela */}
          <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>NOME</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>QUANTIDADE</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>CATEGORIA</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>VALOR</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: '#6B7280' }}>INFO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {produtosExibidos.map((produto) => {
                  const estoqueMin = produto.estoqueMin ?? produto.estoqueMinimo ?? 0; // compatibilidade
                  const statusEstoque = calcularStatusEstoque(produto.estoque, estoqueMin);
                  return (
                    <TableRow key={produto.id}>
                      <TableCell>{produto.nome}</TableCell>
                      <TableCell>{produto.estoque ?? '-'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{produto.categoria || '-'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {produto.precos?.pequeno ? `R$ ${produto.precos.pequeno}` : 'R$ 0,00'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{
                          display: 'inline-block',
                          px: 1.5, py: 0.5,
                          borderRadius: '4px',
                          bgcolor: getStatusColor(statusEstoque),
                          color: getStatusFontColor(statusEstoque),
                          fontSize: '12px',
                          fontWeight: 600,
                          fontFamily: 'Poppins, sans-serif'
                        }}>
                          {statusEstoque}
                        </Box>
                      </TableCell>
                      <TableCell sx={{
                        display:'flex',
                        gap:2,
                        padding:3
                      }}>
                          <img
                          src={pen}
                            style={{ 
                              width:15,
                              cursor:'pointer',
                            }}
                            onClick={() => handleEditClick(produto)}
                            title="Editar"
                          />
                           

                          <img
                          src={trash}
                          style={{
                            width:15,
                            cursor:'pointer',
                          }}
                            onClick={() => handleDelete(produto.id, produto.nome)}
                            disabled={deletingId === produto.id}
                            title={deletingId === produto.id ? 'Excluindo...' : 'Excluir'}
                          />
                            
                     </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>

          {/* Paginação */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap:0 }}>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
              <Button
                key={page}
                size="small"
                onClick={() => setCurrentPage(page)}
                sx={{
                  minWidth: '40px',
                  height: '40px',
                  border: '1px solid #D1D5DB',
                  bgcolor: page === current ? '#F3F4F6' : '#FFFFFF',
                  color: '#374151',
                  borderRadius: 0,
                  fontFamily: 'Poppins, sans-serif',
                  '&:hover': { bgcolor: '#F9FAFB' },
                }}
              >
                {page}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      <EditProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        produtoSelecionado={produtoSelecionado}
      />
      <AddProductModal
        open={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        categorias={categorias}
        onProdutoAdicionado={handleProdutoAdicionado}
      />

      {/* Modal de adicionar categoria */}
      <Modal
        open={addCategoryModalOpen}
        onClose={() => setAddCategoryModalOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={addCategoryModalOpen}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            fontFamily: 'Poppins, sans-serif'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Adicionar Categoria</Typography>
            <TextField
              label="Nome da categoria"
              variant="outlined"
              fullWidth
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setAddCategoryModalOpen(false)} color="inherit">Cancelar</Button>
              <Button
                variant="contained"
                sx={{ bgcolor: '#F75724' }}
                onClick={handleAddCategoria}
              >
                Salvar
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}
