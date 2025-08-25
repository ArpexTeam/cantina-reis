// src/components/ResumoBag.jsx
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

const tiposServico = ["No caixa", "Online", "Agendar"];

const API_URL = `http://localhost:3001/api/checkout`;

// BRL
const formatBRL = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(n ?? 0)
  );

// BRL -> centavos
const toCents = (v) => {
  if (v == null) return 0;
  if (typeof v === "string") {
    const s = v.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  }
  if (typeof v === "number") {
    return Number.isInteger(v) && v >= 100 ? v : Math.round(v * 100);
  }
  return 0;
};

// orderNumber curto (máx 5). Ex.: "4F3C8"
const genOrderNumber5 = () =>
  (Math.floor(Math.random() * 36 ** 5).toString(36).toUpperCase()).padStart(5, "0").slice(-5);

// mapeia itens -> Cielo
function mapSacolaToCieloItems(sacola) {
  return sacola.map((p) => ({
    Name: p?.nome ?? p?.name ?? "Produto",
    Description: p?.descricao ?? p?.description ?? "Item",
    UnitPrice: toCents(p?.precoSelecionado ?? 0),
    Quantity: Number(p?.quantity ?? p?.quantidade ?? 1),
    Type: "Asset",
    Sku: String(p?.id ?? p?.sku ?? "SKU"),
    Weight: Number(p?.peso ?? 0),
  }));
}

function getCheckoutUrl(resData) {
  return (
    resData?.CheckoutUrl ||
    resData?.checkoutUrl ||
    resData?.Settings?.CheckoutUrl ||
    resData?.settings?.checkoutUrl
  );
}

// chama backend -> Cielo
async function criarCheckoutViaBackend({ sacola, orderNumber }) {
  const payload = {
    OrderNumber: orderNumber,                 // usa o curto de 5 chars
    SoftDescriptor: "CantinaReis",
    Cart: {
      Discount: { Type: "Percent", Value: 0 },
      Items: mapSacolaToCieloItems(sacola),
    },
    Shipping: { Type: "WithoutShipping", Price: 0 },
  };

  if (payload.Cart.Items.some((i) => !i.UnitPrice || i.UnitPrice < 1)) {
    console.table(
      payload.Cart.Items.map((i) => ({
        Name: i.Name,
        UnitPrice: i.UnitPrice,
        Quantity: i.Quantity,
      }))
    );
    throw new Error(
      "Algum item está sem preço (centavos). Verifique 'precoSelecionado' na sacola."
    );
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (res.status !== 200 && res.status !== 201) {
    console.error("Checkout erro:", res.status, data || text);
    throw new Error(`Checkout falhou (${res.status}). ${text || ""}`);
  }

  const checkoutUrl = getCheckoutUrl(data);
  if (!checkoutUrl) throw new Error("CheckoutUrl não retornada pelo backend/Cielo.");

  return { checkoutUrl, cieloResponse: data };
}

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
      // no futuro: decidir entre online/caixa dentro do fluxo de agendamento
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

      // checagem básica de estoque (mesma do seu código)
      const itensAgrupados = sacola.reduce((acc, item) => {
        const id = item.id;
        const q = Number(item.quantity ?? item.quantidade ?? 1);
        if (!id) return acc;
        acc[id] = (acc[id] || 0) + (Number.isFinite(q) ? q : 0);
        return acc;
      }, {});
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

      // gera o número curto (5 chars) — usado em ambos os fluxos
      const orderNumber = genOrderNumber5();

      if (servico === "No caixa") {
        // **NÃO** chama Cielo. Cria pedido pendente agora. **NÃO** baixa estoque aqui.
        const pedido = {
          createdAt: serverTimestamp(),
          itens: sacola,
          status: "pendente",
          tipoServico: "No caixa",
          total,
          pagamento: {
            provedor: "offline",
            orderNumber,
          },
        };
        await addDoc(collection(db, "pedidos"), pedido);

        // limpa sacola e vai para tela do número (ajuste a sua rota)
        localStorage.removeItem("sacola");
        navigate(`/numero/${orderNumber}`);
        return;
      }

      // === Online (Cielo) ===
      // 1) cria um "intent" (sem baixar estoque)
      await addDoc(collection(db, "checkoutIntents"), {
        createdAt: serverTimestamp(),
        orderNumber,
        itens: sacola,
        total,
        status: "iniciado",
      });

      // 2) cria o checkout e redireciona
      const { checkoutUrl /*, cieloResponse*/ } = await criarCheckoutViaBackend({
        sacola,
        orderNumber,
      });

      // limpa sacola e redireciona para a Cielo
      localStorage.removeItem("sacola");
      window.location.href = checkoutUrl;
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
        bgcolor: "#fff",
        borderTop: "1px solid #E5E7EB",
        boxShadow: "0 -6px 18px rgba(0,0,0,0.06)",
        px: 2,
        py: 2,
        pb: { xs: "calc(12px + env(safe-area-inset-bottom))", md: 2 },
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
            "&:hover": { borderColor: "#e64c1a", bgcolor: "#FFF1EB" },
          }}
          disabled={disabled}
        >
          {servico || "Selecionar serviço"}
        </Button>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
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
