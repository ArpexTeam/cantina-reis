// src/pages/admin/AdminNFePage.jsx
import React, { useEffect, useState } from "react";
import {
  Box, Button, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Modal, Grid, TextField, Avatar, IconButton
} from "@mui/material";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

// Sidebar / Header (mesmo padrão do dashboard)
import Sidebar from "../../componentes/admin/sidebar";
import logo from "../../img/ChatGPT Image 23 de abr. de 2025, 20_03_44 (1) 2.svg";

// Ícones
import AddIcon from "@mui/icons-material/Add";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import DeleteIcon from "@mui/icons-material/Delete";

// ===================== helpers =====================
function openBase64Pdf(b64) {
  if (!b64) return;
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function downloadXml(b64, nome = "nfe.xml") {
  if (!b64) return;
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const toNumber = (v, def = 0) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : def;
};

// ===================== estilos (iguais aos botões do admin) =====================
const UI = {
  orange: "#FF6B2C",
  orangeHover: "#ff5a10",
  green: "#00B856",
  greenHover: "#00a04c",
  grayBorder: "#D1D5DB",
};
const BTN = {
  base: {
    borderRadius: "8px",
    textTransform: "none",
    fontWeight: 600,
    boxShadow: "0 2px 10px rgba(0,0,0,.07)",
    transition: "transform .2s, box-shadow .2s, filter .2s",
  },
  orange: {
    bgcolor: UI.orange, color: "#fff",
    "&:hover": { bgcolor: UI.orangeHover, boxShadow: "0 6px 22px rgba(255,107,44,.25)", transform: "translateY(-1px)" },
  },
  green: {
    bgcolor: UI.green, color: "#fff",
    "&:hover": { bgcolor: UI.greenHover, boxShadow: "0 6px 22px rgba(0,184,86,.25)", transform: "translateY(-1px)" },
  },
  outlineOrange: {
    border: `2px solid ${UI.orange}`, color: UI.orange, bgcolor: "#fff",
    "&:hover": { borderColor: UI.orangeHover, bgcolor: "#fff7f3" },
  },
  ghost: {
    border: `1px solid ${UI.grayBorder}`, color: "#374151", bgcolor: "#fff",
    "&:hover": { bgcolor: "#F3F4F6" },
  },
};
const ICON = {
  base: {
    width: 36, height: 36, borderRadius: "8px", border: "2px solid transparent",
    boxShadow: "0 2px 10px rgba(0,0,0,.07)",
  },
  green: { bgcolor: UI.green, color: "#fff", "&:hover": { bgcolor: UI.greenHover } },
  orange: { bgcolor: UI.orange, color: "#fff", "&:hover": { bgcolor: UI.orangeHover } },
};

// ===================== MODAL: Adicionar NF (multi-itens) =====================
function AddNFModal({ open, onClose, onCreated }) {
  const defaultItem = {
    codigo: "", ncm: "", cfop: "", cest: "", unidade: "",
    origem: 0, cst_icms: "", aliquota_icms: "", cst_pis: "",
    aliquota_pis: "", cst_cofins: "", aliquota_cofins: "",
    cEAN: "SEM GTIN", cEANTrib: "SEM GTIN",
    quantidade: 1, valor: ""
  };
  const [itens, setItens] = useState([{ ...defaultItem }]);
  const up = (i, k, v) => setItens(prev => prev.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const addItem = () => setItens(prev => [...prev, { ...defaultItem }]);
  const rmItem = (i) => setItens(prev => prev.filter((_, idx) => idx !== i));
  const total = itens.reduce((acc, it) => acc + toNumber(it.quantidade, 1) * toNumber(it.valor, 0), 0);

  const clienteDefault = {
    cpf: "12345678909",
    nome: "Consumidor Final",
    endereco: {
      rua: "Rua Teste", numero: "123", bairro: "Centro",
      cMun: "3550308", cidade: "São Paulo", UF: "SP", CEP: "01001000",
      fone: "11999999999"
    }
  };

  async function emitir() {
    try {
      const produtos = itens.map((it, idx) => ({
        cProd: String(it.codigo || idx + 1),
        cEAN: String(it.cEAN || "SEM GTIN"),
        xProd: String(it.codigo || "Item NF Manual"),
        NCM: String(it.ncm || "00000000"),
        CFOP: String(it.cfop || "5102"),
        uCom: String(it.unidade || "UN"),
        qCom: toNumber(it.quantidade, 1),
        vUnCom: toNumber(it.valor, 0),
        cEANTrib: String(it.cEANTrib || "SEM GTIN"),
        orig: Number(it.origem || 0),
        CST: String(it.cst_icms || "00"),
        pICMS: toNumber(it.aliquota_icms, 0),
        cst_pis: String(it.cst_pis || "01"),
        pPIS: toNumber(it.aliquota_pis, 0),
        cst_cofins: String(it.cst_cofins || "01"),
        pCOFINS: toNumber(it.aliquota_cofins, 0),
      }));

      const resp = await fetch("https://nfe-emissor.onrender.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente: clienteDefault, produtos })
      });
      const nf = await resp.json();

      await addDoc(collection(db, "nfe_manuais"), {
        createdAt: serverTimestamp(),
        status: nf.status ?? (resp.ok ? "sucesso" : "erro"),
        total,
        chave: nf.chave ?? null,
        danfeBase64: nf.danfeBase64 ?? null,
        xmlBase64: nf.xmlBase4 ?? nf.xmlBase64 ?? null, // compat
        itensFiscais: itens
      });

      onCreated?.();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Falha ao emitir/salvar NF.");
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "90%", maxWidth: 980, maxHeight: "90vh",
        bgcolor: "#fff", p: 3, overflowY: "auto", borderRadius: 2
      }}>
        <Typography variant="h6" fontWeight={700} mb={2}>Adicionar NF</Typography>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            sx={{ ...BTN.base, ...BTN.outlineOrange }}
            onClick={addItem}
          >
            Adicionar item
          </Button>
        </Box>

        {itens.map((it, i) => (
          <Paper key={i} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography fontWeight={700}>Item #{i + 1}</Typography>
              {itens.length > 1 && (
                <IconButton sx={{ ...ICON.base, ...ICON.orange }} onClick={() => rmItem(i)} title="Remover item">
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><TextField fullWidth label="Código" value={it.codigo} onChange={e => up(i,"codigo",e.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="NCM" value={it.ncm} onChange={e => up(i,"ncm",e.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="CFOP" value={it.cfop} onChange={e => up(i,"cfop",e.target.value)} /></Grid>

              <Grid item xs={12} md={4}><TextField fullWidth label="CEST" value={it.cest} onChange={e => up(i,"cest",e.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Unidade" value={it.unidade} onChange={e => up(i,"unidade",e.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Origem" value={it.origem} onChange={e => up(i,"origem",e.target.value)} /></Grid>

              <Grid item xs={12} md={4}><TextField fullWidth label="CST ICMS" value={it.cst_icms} onChange={e => up(i,"cst_icms",e.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Alíquota ICMS (%)" value={it.aliquota_icms} onChange={e => up(i,"aliquota_icms",e.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="CST PIS" value={it.cst_pis} onChange={e => up(i,"cst_pis",e.target.value)} /></Grid>

              <Grid item xs={12} md={4}><TextField fullWidth label="Alíquota PIS (%)" value={it.aliquota_pis} onChange={e => up(i,"aliquota_pis",e.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="CST COFINS" value={it.cst_cofins} onChange={e => up(i,"cst_cofins",e.target.value)} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth label="Alíquota COFINS (%)" value={it.aliquota_cofins} onChange={e => up(i,"aliquota_cofins",e.target.value)} /></Grid>

              <Grid item xs={12} md={6}><TextField fullWidth label="cEAN" value={it.cEAN} onChange={e => up(i,"cEAN",e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="cEANTrib" value={it.cEANTrib} onChange={e => up(i,"cEANTrib",e.target.value)} /></Grid>

              <Grid item xs={6} md={3}><TextField fullWidth label="Quantidade" value={it.quantidade} onChange={e => up(i,"quantidade",e.target.value)} /></Grid>
              <Grid item xs={6} md={3}><TextField fullWidth label="Valor (R$)" value={it.valor} onChange={e => up(i,"valor",e.target.value)} /></Grid>
            </Grid>
          </Paper>
        ))}

        <Typography sx={{ fontWeight: 700, textAlign: "right", mb: 2 }}>
          Total: R$ {total.toFixed(2)}
        </Typography>

        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
                 variant="contained"
                 sx={{ textTransform: 'capitalize', fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 14, mt: 3, bgcolor: '#F75724', py: 1, px: 5 }}
                 onClick={emitir}
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
        </Box>
      </Box>
    </Modal>
  );
}

// ===================== PÁGINA =====================
export default function AdminNFePage() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);

  async function load() {
    const q = query(collection(db, "nfe_manuais"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }
  useEffect(() => { load().catch(console.error); }, []);

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, bgcolor: "#F8F8F8" }}>
        {/* Header fixo preto */}
        <Box
          sx={{
            width: "100%",
            height: 80,
            px: 4,
            backgroundColor: "#000",
            color: "#FFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxSizing: "border-box",
            position: "absolute",
            left: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ height: 70, width: "auto" }}>
            <img src={logo} alt="Logo" style={{ width: "100%", height: "100%" }} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2, flexWrap: "nowrap" }}>
            <Avatar src="https://via.placeholder.com/150" />
            <Typography component="span" sx={{ display: "inline-flex" }}>
              Administrador
            </Typography>
          </Box>
        </Box>

        {/* Conteúdo principal */}
        <Box sx={{ p: 4, mt: 10 }}>
          <Typography variant="h5" fontWeight={700} textAlign="center">
            NF-e (manuais)
          </Typography>
          <Box sx={{ borderBottom: "2px solid black", width: "100%", mt: 1, mb: 3 }} />

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              sx={{ ...BTN.base, ...BTN.orange }}
              onClick={() => setOpen(true)}
            >
              Adicionar NF
            </Button>
          </Box>

          {/* Tabela */}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Itens</TableCell>
                  <TableCell>Chave</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.createdAt?.toDate?.().toLocaleString?.() ?? "-"}</TableCell>
                    <TableCell>
                      {Array.isArray(r.itensFiscais) ? `${r.itensFiscais.length} itens` : (r.itemFiscal?.codigo ?? "-")}
                    </TableCell>
                    <TableCell title={r.chave || ""}>
                      {r.chave ? `${r.chave.slice(0, 8)}…${r.chave.slice(-6)}` : "-"}
                    </TableCell>
                    <TableCell align="right">R$ {Number(r.total || 0).toFixed(2)}</TableCell>
                    <TableCell>{r.status ?? "-"}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        sx={{ ...ICON.base, ...ICON.green, mr: 1,
                              '&:hover': {
                              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
                              transform: 'translateY(-1px)',
                              backgroundColor: '#00a04c',
                              

                            }, }}
                        disabled={!r.danfeBase64}
                        onClick={() => openBase64Pdf(r.danfeBase64)}
                        title="Ver DANFE"
                      >
                        <PictureAsPdfIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        sx={{ ...ICON.base, ...ICON.orange,
                             '&:hover': {
                              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
                              transform: 'translateY(-1px)',
                              backgroundColor: '#e64c1a',
                            },
                         }}
                        disabled={!r.xmlBase64}
                        onClick={() => downloadXml(r.xmlBase64, `nfe-${r.chave || r.id}.xml`)}
                        title="Baixar XML"
                      >
                        <CloudDownloadIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Nenhuma NF manual encontrada.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      <AddNFModal open={open} onClose={() => setOpen(false)} onCreated={() => load()} />
    </Box>
  );
}
