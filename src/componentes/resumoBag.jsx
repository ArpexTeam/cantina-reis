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

      // ====== REMOVIDO: emissão de NF-e ======
      // - Construção de itens fiscais
      // - POST para emissor externo
      // - Armazenamento de dados da NF-e no pedido

      // ---- Salva pedido (sem NF-e) ----
      const pedido = {
        createdAt: serverTimestamp(),
        itens: sacola,
        status: "pendente",
        tipoServico: servico,
        total,
      };

      try {
        await addDoc(collection(db, "pedidos"), pedido);
      } catch (err) {
        // ROLLBACK do estoque se falhar ao salvar o pedido
        await runTransaction(db, async (transaction) => {
          for (const [id, qtd] of Object.entries(itensAgrupados)) {
            const ref = doc(db, "produtos", id);
            transaction.update(ref, { estoque: increment(qtd) });
          }
        });
        throw err;
      }

      alert("Pedido salvo e estoque atualizado com sucesso!");
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
