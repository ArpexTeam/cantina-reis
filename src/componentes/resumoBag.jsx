import React from "react";
import { Box, Typography, Button, Menu, MenuItem } from "@mui/material";
import { KeyboardArrowDown } from "@mui/icons-material";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  runTransaction,
  increment,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const tiposServico = ["No local", "Agendar"];

const formatBRL = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(n ?? 0)
  );

const ResumoBag = ({ quantidade, total, servico, onSelect }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const finalizarPedido = async () => {
    if (loading) return;

    if (!servico) {
      alert("Selecione o tipo de serviço!");
      return;
    }

    if (servico === "Agendar") {
      navigate("/agendar");
      return;
    }

    try {
      setLoading(true);

      const sacola = JSON.parse(localStorage.getItem("sacola") || "[]");
      if (!Array.isArray(sacola) || sacola.length === 0) {
        alert("Sacola vazia!");
        setLoading(false);
        return;
      }

      // ---- Agrupa quantidades por produto (id) ----
      const itensAgrupados = sacola.reduce((acc, item) => {
        const id = item.id;
        const q = Number(item.quantity ?? item.quantidade ?? 1);
        if (!id) return acc;
        acc[id] = (acc[id] || 0) + (Number.isFinite(q) ? q : 0);
        return acc;
      }, {});

      // ---- Pré-validação de estoque ----
      for (const [id, qtd] of Object.entries(itensAgrupados)) {
        const ref = doc(db, "produtos", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          alert("Produto não encontrado no banco!");
          setLoading(false);
          return;
        }
        const data = snap.data();
        const estoqueAtual = Number(data?.estoque ?? 0);
        if (estoqueAtual < qtd) {
          alert(
            `Estoque insuficiente para "${data?.nome ?? "produto"}". Disponível: ${estoqueAtual}, solicitado: ${qtd}.`
          );
          setLoading(false);
          return;
        }
      }

      // ---- Busca 1 produto para defaults fiscais da NF-e ----
      const primeiroId = sacola[0].id;
      const primeiroRef = doc(db, "produtos", primeiroId);
      const primeiroSnap = await getDoc(primeiroRef);
      if (!primeiroSnap.exists()) {
        alert("Produto não encontrado no banco!");
        setLoading(false);
        return;
      }
      const produtoData = primeiroSnap.data();

      // ---- Transação: decrementa os estoques de TODOS os itens ----
      await runTransaction(db, async (transaction) => {
        for (const [id, qtd] of Object.entries(itensAgrupados)) {
          const ref = doc(db, "produtos", id);
          const snap = await transaction.get(ref);
          const data = snap.data();
          const estoqueAtual = Number(data?.estoque ?? 0);
          if (estoqueAtual < qtd) {
            throw new Error(`Estoque insuficiente para "${data?.nome ?? id}".`);
          }
          transaction.update(ref, { estoque: estoqueAtual - qtd });
        }
      });

      // ---- Monta itens para NF-e ----
      const produtos = sacola.map((item) => ({
        cProd: String(item.codigo || item.id || "001"),
        cEAN: String(item.cEAN || "SEM GTIN"),
        xProd: String(item.nome || "Produto"),
        NCM: String(produtoData.ncm || "00000000"),
        CFOP: String(produtoData.cfop || "5102"),
        uCom: String(produtoData.unidade || "UN"),
        qCom: Number(item.quantity ?? item.quantidade ?? 1),
        vUnCom: Number(item.precoSelecionado ?? item.preco ?? 0),
        cEANTrib: String(item.cEANTrib || "SEM GTIN"),
        orig: Number(produtoData.origem ?? 0),
        CST: String(produtoData.cst_icms ?? "00"),
        pICMS: Number(produtoData.aliquota_icms ?? 18),
        pPIS: Number(produtoData.aliquota_pis ?? 1.65),
        pCOFINS: Number(produtoData.aliquota_cofins ?? 7.6),
        cst_pis: String(produtoData.cst_pis ?? "01"),
        cst_cofins: String(produtoData.cst_cofins ?? "01"),
      }));

      const dadosNFE = {
        cliente: {
          cpf: "12345678909",
          nome: "Consumidor Final",
          endereco: {
            rua: "Rua Teste",
            numero: "123",
            bairro: "Centro",
            cMun: "3550308",
            cidade: "São Paulo",
            UF: "SP",
            CEP: "01001000",
            fone: "11999999999",
          },
        },
        produtos,
      };

      // ---- Emite a NF-e ----
      const resp = await fetch("https://nfe-emissor.onrender.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosNFE),
      });
      const nf = await resp.json();

      if (nf.status !== "sucesso") {
        // ROLLBACK do estoque se a NF falhar
        await runTransaction(db, async (transaction) => {
          for (const [id, qtd] of Object.entries(itensAgrupados)) {
            const ref = doc(db, "produtos", id);
            transaction.update(ref, { estoque: increment(qtd) });
          }
        });

        console.error("Erro na emissão da NF-e:", nf?.mensagem || nf);
        alert("Erro ao emitir NF-e!");
        setLoading(false);
        return;
      }

      // ---- Salva pedido com NF-e anexada ----
      await addDoc(collection(db, "pedidos"), {
        createdAt: serverTimestamp(),
        itens: sacola,
        status: "pendente",
        tipoServico: servico,
        total,
        nfe: {
          chave: nf.chave,
          danfeBase64: nf.danfeBase64,
          xmlBase64: nf.xmlBase64,
        },
      });

      alert("Pedido salvo, estoque atualizado e NF-e emitida com sucesso!");
      localStorage.removeItem("sacola");
      navigate("/cardapio");
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      alert(error.message || "Erro ao finalizar pedido!");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !quantidade || quantidade <= 0;

  return (
    <Box
      id="resumoPedido"
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: quantidade > 0 ? 0 : "-120px",
        zIndex: 10,
        transition: "all 0.3s ease-in-out",

        // visual
        bgcolor: "#fff",
        borderTop: "1px solid #E5E7EB",
        boxShadow: "0 -6px 18px rgba(0,0,0,0.06)",

        // padding com safe-area
        px: 2,
        py: 2,
        pb: { xs: "calc(12px + env(safe-area-inset-bottom))", md: 2 },

        // no desktop: centraliza e limita largura
        width: "100%",
        maxWidth: { md: 980, lg: 1200 },
        mx: { md: "auto" },
        borderTopLeftRadius: { md: 12 },
        borderTopRightRadius: { md: 12 },

        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 12, color: "#6B7280" }}>
          Sua sacola
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 16 }}>
          {formatBRL(total)}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="outlined"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          endIcon={<KeyboardArrowDown />}
          sx={{
            borderColor: "#F75724",
            color: "#F75724",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: 1,
            fontSize: 13,
            px: 1.5,
            "&:hover": {
              borderColor: "#e64c1a",
              bgcolor: "#FFF1EB",
            },
          }}
          disabled={disabled}
        >
          {servico || "Selecionar serviço"}
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          {tiposServico.map((tipo) => (
            <MenuItem
              key={tipo}
              onClick={() => {
                onSelect(tipo);
                setAnchorEl(null);
              }}
            >
              {tipo}
            </MenuItem>
          ))}
        </Menu>

        <Button
          variant="contained"
          sx={{
            backgroundColor: "#F75724",
            "&:hover": { backgroundColor: "#e6491c" },
            fontWeight: 800,
            textTransform: "none",
            borderRadius: 1,
            fontSize: 13,
            px: 2,
            minWidth: 160,
            boxShadow: "0 6px 18px rgba(255,107,44,.20)",
          }}
          onClick={finalizarPedido}
          disabled={disabled}
        >
          {loading ? "Processando..." : "Finalizar compra"}
        </Button>
      </Box>
    </Box>
  );
};

export default ResumoBag;
