import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Button, TextField, Stack, Modal, Backdrop, Fade, Checkbox, FormControlLabel,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  Accordion, AccordionSummary, AccordionDetails, Radio, FormControl, FormControlLabel as RFormControlLabel,
  InputAdornment
} from '@mui/material';
import RadioGroup from '@mui/material/RadioGroup';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  collection, getDocs, addDoc, runTransaction, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';

// ========= Util: número sequencial diário até 4 dígitos ==========
function getTodayKeySP() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()); // "YYYY-MM-DD"
}

async function getNextDailyOrderNumber() {
  const todayKey = getTodayKeySP();
  const ref = doc(db, 'orderCounters', todayKey);
  let nextNumber;

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) {
      transaction.set(ref, { current: 1, updatedAt: serverTimestamp() });
      nextNumber = 1;
    } else {
      const current = Number(snap.data()?.current || 0);
      nextNumber = current + 1;
      if (nextNumber > 9999) throw new Error('Limite diário de 9999 pedidos atingido.');
      transaction.update(ref, { current: nextNumber, updatedAt: serverTimestamp() });
    }
  });

  return String(nextNumber); // "1".."9999"
}

// ========= Helpers de preço ==========
const toNumberBR = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const s = v.replace(/R\$\s?/i, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const formatBRL = (n) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;

const getDefaultSizeKey = (precos = {}, config = {}) => {
  const keys = Object.keys(precos || {});
  const hasSizes = config.habilitarTamanhos ?? (keys.length > 1);
  if (!hasSizes) return 'pequeno';
  if (keys.includes('pequeno')) return 'pequeno';
  return keys[0];
};

const sizeOrder = ['pequeno', 'medio', 'executivo'];

const getOrderedSizeKeys = (precos = {}) => {
  const entries = Object.entries(precos || {});
  const known = sizeOrder.filter((k) => precos[k] !== undefined);
  const others = entries.map(([k]) => k).filter((k) => !known.includes(k));
  return [...known, ...others];
};

// ========= Dialog para configurar UM item =========
function ItemConfigDialog({ open, onClose, produto, value, onChange }) {
  const safeProduto = produto || {};
  const cfg = safeProduto.config || {};
  const precos = safeProduto.precos || {};

  const hasSizes = !!(cfg.habilitarTamanhos ?? (Object.keys(precos).length > 1));
  const hasAddons = !!(cfg.habilitarGuarnicoes ?? (Array.isArray(safeProduto.guarnicoes) && safeProduto.guarnicoes.length > 0));
  const maxGuarnicoes = Number(cfg.maxGuarnicoes ?? 2);

  const orderedSizeKeys = useMemo(() => getOrderedSizeKeys(precos), [precos]);

  const tamanho = value?.tamanho ?? getDefaultSizeKey(precos, cfg);
  const guarnicoes = Array.isArray(value?.guarnicoes) ? value.guarnicoes : [];
  const observacao = value?.observacao ?? '';

  const toggleGuarnicao = (opcao) => {
    const ja = guarnicoes.includes(opcao);
    if (ja) {
      onChange({ ...value, guarnicoes: guarnicoes.filter((g) => g !== opcao) });
    } else {
      if (maxGuarnicoes > 0 && guarnicoes.length >= maxGuarnicoes) return;
      onChange({ ...value, guarnicoes: [...guarnicoes, opcao] });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Configurar item</DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>
          {safeProduto.nome || 'Produto'}
        </Typography>

        {/* Tamanhos */}
        {hasSizes && (
          <Accordion defaultExpanded disableGutters sx={{ boxShadow: 'none' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>Tamanhos</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl>
                {orderedSizeKeys.map((k) => {
                  const v = toNumberBR(precos[k]);
                  if (!v || v <= 0) return null;
                  const label = k.charAt(0).toUpperCase() + k.slice(1).replace('medio', 'médio');
                  return (
                    <RFormControlLabel
                      key={k}
                      value={k}
                      control={
                        <Radio
                          checked={tamanho === k}
                          onChange={() => onChange({ ...value, tamanho: k })}
                          sx={{ color: '#F75724', '&.Mui-checked': { color: '#F75724' } }}
                        />
                      }
                      label={`${label} - ${formatBRL(v)}`}
                      sx={{ mr: 1 }}
                    />
                  );
                })}
              </FormControl>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Guarnições */}
        {hasAddons && Array.isArray(safeProduto.guarnicoes) && safeProduto.guarnicoes.length > 0 && (
          <Accordion defaultExpanded disableGutters sx={{ boxShadow: 'none' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box>
                <Typography fontWeight={600}>Guarnições</Typography>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                  {`Selecione até ${maxGuarnicoes} opção(ões)`}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {safeProduto.guarnicoes.map((opcao, i) => (
                <FormControlLabel
                  key={i}
                  control={
                    <Checkbox
                      checked={guarnicoes.includes(opcao)}
                      onChange={() => toggleGuarnicao(opcao)}
                      sx={{ color: '#F75724', '&.Mui-checked': { color: '#F75724' } }}
                    />
                  }
                  label={opcao}
                />
              ))}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Observações */}
        <Accordion defaultExpanded disableGutters sx={{ boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>Observações</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Observações para a cozinha / atendimento..."
              value={observacao}
              onChange={(e) => onChange({ ...value, observacao: e.target.value })}
            />
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ========= Modal principal =========
export default function NovoPedidoModal({ open, onClose, onCreated }) {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [qtds, setQtds] = useState({});
  const [configs, setConfigs] = useState({});
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [aprovarAgora, setAprovarAgora] = useState(true);
  const [loading, setLoading] = useState(false);

  const [cfgOpen, setCfgOpen] = useState(false);
  const [cfgProduto, setCfgProduto] = useState(null);

  // ===== Pagamento =====
  const [pagamentoTipo, setPagamentoTipo] = useState('dinheiro'); // 'dinheiro' | 'pix' | 'cartao' | 'outro'
  const [valorRecebido, setValorRecebido] = useState(''); // string para facilitar digitação com vírgula

  // ---------- helpers para reset ----------
  function makeInitialConfigs(list) {
    const initial = {};
    for (const p of list || []) {
      const cfg = p?.config || {};
      const defaultSize = getDefaultSizeKey(p?.precos || {}, cfg);
      initial[p.id] = { tamanho: defaultSize, guarnicoes: [], observacao: '' };
    }
    return initial;
  }

  function resetForm(list) {
    setBusca('');
    setQtds({});
    setConfigs(makeInitialConfigs(list ?? produtos));
    setNome('');
    setTelefone('');
    setAprovarAgora(true);
    setPagamentoTipo('dinheiro');
    setValorRecebido('');
    setCfgOpen(false);
    setCfgProduto(null);
  }

  const handleCloseModal = () => {
    resetForm(produtos);
    onClose?.();
  };

  // carrega catálogo ao abrir (e já reseta tudo)
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'produtos'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));
        setProdutos(list);
        resetForm(list);
      } catch (e) {
        console.error('Erro ao carregar produtos:', e);
      }
    })();
  }, [open]);

  const setQtd = (id, v) => {
    const n = Math.max(0, Number(v || 0));
    setQtds(prev => ({ ...prev, [id]: Number.isFinite(n) ? n : 0 }));
  };

  const openConfig = (produto) => {
    setCfgProduto(produto);
    setCfgOpen(true);
  };

  const updateItemConfig = (produtoId, nextCfg) => {
    setConfigs(prev => ({ ...prev, [produtoId]: nextCfg }));
  };

  // itens selecionados
  const itensSelecionados = useMemo(() => {
    return produtos
      .filter(p => (qtds[p.id] || 0) > 0)
      .map(p => {
        const cfg = configs[p.id] || {};
        const tamanho = cfg.tamanho ?? getDefaultSizeKey(p.precos || {}, p.config || {});
        const unit = toNumberBR(
          (p.config?.habilitarTamanhos ?? (Object.keys(p.precos || {}).length > 1))
            ? p.precos?.[tamanho] ?? 0
            : p.precos?.pequeno ?? 0
        );
        return {
          id: p.id,
          nome: p.nome || 'Produto',
          quantidade: Number(qtds[p.id] || 0),
          preco: Number(unit || 0),
          tamanho,
          guarnicoes: Array.isArray(cfg.guarnicoes) ? cfg.guarnicoes : [],
          observacao: cfg.observacao ?? '',
        };
      });
  }, [produtos, qtds, configs]);

  const total = itensSelecionados.reduce(
    (acc, it) => acc + (Number(it.preco) * Number(it.quantidade)),
    0
  );

  // ====== FILTRO: apenas nome e código ======
  const termo = busca.trim().toLowerCase();
  const filtrados = produtos.filter((p) => {
    if (termo === '') return true;
    const nome = (p.nome || '').toLowerCase();
    const codigo = String(p.codigo || '').toLowerCase();
    return nome.includes(termo) || codigo.includes(termo);
  });

  // ===== Pagamento: cálculos de troco / validação =====
  const valorRecebidoNum = pagamentoTipo === 'dinheiro' ? toNumberBR(valorRecebido) : 0;
  const troco = pagamentoTipo === 'dinheiro' ? Math.max(0, valorRecebidoNum - total) : 0;
  const falta = pagamentoTipo === 'dinheiro' ? Math.max(0, total - valorRecebidoNum) : 0;

  const canApprove = !(aprovarAgora && pagamentoTipo === 'dinheiro' && valorRecebidoNum < total);

  const handleCriar = async () => {
    try {
      if (loading) return;
      setLoading(true);

      if (itensSelecionados.length === 0) {
        alert('Selecione ao menos 1 item com quantidade > 0.');
        setLoading(false);
        return;
      }

      if (aprovarAgora && pagamentoTipo === 'dinheiro' && valorRecebidoNum < total) {
        alert('Valor recebido em dinheiro é menor que o total. Ajuste antes de aprovar.');
        setLoading(false);
        return;
      }

      const orderNumber = await getNextDailyOrderNumber();

      const pagamentoData = {
        provedor: 'offline',
        orderNumber,
        tipo: pagamentoTipo,
        ...(pagamentoTipo === 'dinheiro' ? { valorRecebido: valorRecebidoNum, troco } : {})
      };

      if (!aprovarAgora) {
        await addDoc(collection(db, 'pedidos'), {
          createdAt: serverTimestamp(),
          itens: itensSelecionados,
          status: 'pendente',
          tipoServico: 'No caixa',
          total,
          nome: nome || '',
          telefone: telefone || '',
          pagamento: pagamentoData,
        });

        localStorage.setItem('lastOrderNumber', orderNumber);
        localStorage.setItem('lastOrderSavedAt', new Date().toISOString());

        resetForm(produtos);
        onCreated?.();
        handleCloseModal();
        return;
      }

      // ====== TRANSAÇÃO CORRIGIDA: TODAS AS LEITURAS ANTES DE QUALQUER ESCRITA ======
      await runTransaction(db, async (transaction) => {
        // 1) Agrega quantidades por produto
        const mapaQtd = new Map(); // id -> qtd total
        for (const item of itensSelecionados) {
          const id = item.id;
          const qtd = Number(item.quantidade ?? item.quantity ?? 0);
          if (!id || !qtd) continue;
          mapaQtd.set(id, (mapaQtd.get(id) || 0) + qtd);
        }

        // 2) Referências e TODAS as leituras
        const prodIds = Array.from(mapaQtd.keys());
        const prodRefs = prodIds.map((pid) => doc(db, 'produtos', pid));

        const snaps = [];
        for (const ref of prodRefs) {
          const snap = await transaction.get(ref);
          if (!snap.exists()) throw new Error(`Produto ${ref.id} não encontrado.`);
          snaps.push(snap);
        }

        // 3) Valida estoques com base nas leituras
        snaps.forEach((snap, idx) => {
          const pid = prodIds[idx];
          const dados = snap.data();
          const estoqueAtual = Number(dados?.estoque ?? 0);
          const qtdNecessaria = mapaQtd.get(pid) || 0;
          if (estoqueAtual < qtdNecessaria) {
            throw new Error(
              `Estoque insuficiente para "${dados?.nome || pid}". ` +
              `Disp.: ${estoqueAtual}, solic.: ${qtdNecessaria}`
            );
          }
        });

        // 4) Escritas: atualiza estoques
        snaps.forEach((snap, idx) => {
          const pid = prodIds[idx];
          const dados = snap.data();
          const estoqueAtual = Number(dados?.estoque ?? 0);
          const qtdNecessaria = mapaQtd.get(pid) || 0;
          transaction.update(prodRefs[idx], { estoque: estoqueAtual - qtdNecessaria });
        });

        // 5) Cria o pedido aprovado
        const pedidosRef = collection(db, 'pedidos');
        const novoRef = doc(pedidosRef);
        transaction.set(novoRef, {
          createdAt: serverTimestamp(),
          itens: itensSelecionados,
          status: 'aprovado',
          tipoServico: 'No caixa',
          total,
          nome: nome || '',
          telefone: telefone || '',
          pagamento: pagamentoData,
        });
      });

      localStorage.setItem('lastOrderNumber', orderNumber);
      localStorage.setItem('lastOrderSavedAt', new Date().toISOString());

      resetForm(produtos);
      onCreated?.();
      handleCloseModal();
    } catch (e) {
      console.error('Erro ao criar pedido:', e);
      alert(e?.message || 'Falha ao criar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  const precoRefAtual = (p) => {
    const c = configs[p.id];
    const tamanho = c?.tamanho ?? getDefaultSizeKey(p.precos || {}, p.config || {});
    const hasSizes = p.config?.habilitarTamanhos ?? (Object.keys(p.precos || {}).length > 1);
    const unit = toNumberBR(hasSizes ? p.precos?.[tamanho] : p.precos?.pequeno);
    return Number(unit || 0);
  };

  return (
    <>
      {/* MODAL PRINCIPAL */}
      <Modal
        open={open}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 250 }}
      >
        <Fade in={open}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95%', md: 1000 },
            maxHeight: '90vh',
            overflow: 'auto',
            bgcolor: '#fff', borderRadius: 2, boxShadow: 24, p: 3,
            fontFamily: 'Poppins, sans-serif'
          }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Novo pedido (caixa)
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
              Selecione os itens, quantidades e configure tamanhos/guarnições/observações por item.
            </Typography>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Nome do cliente (opcional)"
                fullWidth
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <TextField
                label="Telefone (opcional)"
                fullWidth
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </Stack>

            <TextField
              placeholder="Buscar por nome ou código..."
              size="small"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              sx={{
                bgcolor: '#fff', borderRadius: '6px', mb: 2,
                '& .MuiOutlinedInput-root': { height: 40 }
              }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: '#9CA3AF', mr: 1 }} fontSize="small" />
                )
              }}
            />

            <Paper variant="outlined" sx={{ p: 1, mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Produto</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 120 }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Categoria</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Preço (unit.)</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 160 }}>Quantidade</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 160 }}>Configuração</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtrados.map((p) => {
                    const unit = precoRefAtual(p);
                    const q = qtds[p.id] || 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{p.nome || '-'}</TableCell>
                        <TableCell>{p.codigo || '-'}</TableCell>
                        <TableCell>{p.categoria || '-'}</TableCell>
                        <TableCell>{formatBRL(unit)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Button
                              variant="outlined"
                              onClick={() => setQtd(p.id, q - 1)}
                              sx={{ minWidth: 32, px: 0 }}
                            >-</Button>
                            <TextField
                              size="small"
                              value={q}
                              onChange={(e) => setQtd(p.id, e.target.value)}
                              sx={{ width: 70 }}
                              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                            />
                            <Button
                              variant="outlined"
                              onClick={() => setQtd(p.id, q + 1)}
                              sx={{ minWidth: 32, px: 0 }}
                            >+</Button>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<TuneIcon />}
                            onClick={() => openConfig(p)}
                            sx={{ textTransform: 'none' }}
                          >
                            {(() => {
                              const c = configs[p.id];
                              if (!c) return 'Detalhes';
                              const parts = [];
                              if (c.tamanho) parts.push(c.tamanho === 'medio' ? 'médio' : c.tamanho);
                              if (Array.isArray(c.guarnicoes) && c.guarnicoes.length > 0) parts.push(`${c.guarnicoes.length} guarn.`);
                              if (c.observacao) parts.push('obs.');
                              return parts.length ? parts.join(' • ') : 'Detalhes';
                            })()}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>

            {/* RESUMO + PAGAMENTO */}
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={aprovarAgora}
                    onChange={(e) => setAprovarAgora(e.target.checked)}
                  />
                }
                label="Aprovar agora (baixar estoque imediatamente)"
              />
              <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                Total: {formatBRL(total)}
              </Typography>
            </Stack>

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>Forma de pagamento</Typography>
              <RadioGroup
                row
                value={pagamentoTipo}
                onChange={(e) => setPagamentoTipo(e.target.value)}
              >
                <RFormControlLabel
                  value="dinheiro"
                  control={<Radio sx={{ color: '#F75724', '&.Mui-checked': { color: '#F75724' } }} />}
                  label="Dinheiro"
                />
                <RFormControlLabel
                  value="pix"
                  control={<Radio sx={{ color: '#F75724', '&.Mui-checked': { color: '#F75724' } }} />}
                  label="PIX"
                />
                <RFormControlLabel
                  value="cartao"
                  control={<Radio sx={{ color: '#F75724', '&.Mui-checked': { color: '#F75724' } }} />}
                  label="Cartão"
                />
                <RFormControlLabel
                  value="outro"
                  control={<Radio sx={{ color: '#F75724', '&.Mui-checked': { color: '#F75724' } }} />}
                  label="Outro"
                />
              </RadioGroup>

              {pagamentoTipo === 'dinheiro' && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }} alignItems="center">
                  <TextField
                    label="Valor recebido"
                    value={valorRecebido}
                    onChange={(e) => setValorRecebido(e.target.value)}
                    placeholder="0,00"
                    inputProps={{ inputMode: 'decimal' }}
                    sx={{ maxWidth: 240 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>
                    }}
                  />
                  {valorRecebido !== '' && (
                    <>
                      {falta > 0 ? (
                        <Typography sx={{ color: '#b91c1c', fontWeight: 700 }}>
                          Falta: {formatBRL(falta)}
                        </Typography>
                      ) : (
                        <Typography sx={{ color: '#047857', fontWeight: 700 }}>
                          Troco: {formatBRL(troco)}
                        </Typography>
                      )}
                    </>
                  )}
                </Stack>
              )}
            </Paper>

            <Divider sx={{ mb: 2 }} />

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={handleCloseModal} color="inherit" sx={{ textTransform: 'none' }}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleCriar}
                disabled={loading || !canApprove}
                sx={{
                  bgcolor: '#F75724',
                  textTransform: 'none',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#e6491c' }
                }}
              >
                {loading ? 'Salvando...' : (aprovarAgora ? 'Criar & Aprovar' : 'Criar pendente')}
              </Button>
            </Stack>
          </Box>
        </Fade>
      </Modal>

      {/* DIALOG DE CONFIGURAÇÃO DE ITEM */}
      <ItemConfigDialog
        open={cfgOpen}
        produto={cfgProduto}
        value={cfgProduto ? (configs[cfgProduto.id] || {}) : {}}
        onChange={(next) => {
          if (!cfgProduto) return;
          updateItemConfig(cfgProduto.id, next);
        }}
        onClose={() => setCfgOpen(false)}
      />
    </>
  );
}
