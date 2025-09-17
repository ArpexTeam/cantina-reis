// src/pages/CheckoutReturn.jsx
import React from "react";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Button,
  Alert,
  Stack,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

/* ================ QZ Tray loader (CDN + fallback local) ================== */
const QZ_SOURCES = [
  "https://cdnjs.cloudflare.com/ajax/libs/qz-tray/2.1.0/qz-tray.js",
  "/qz-tray.js",
];

function injectScript(src) {
  return new Promise((resolve, reject) => {
    if (
      document.querySelector(`script[data-qz-src="${src}"]`) ||
      document.querySelector(`script[src="${src}"]`)
    ) {
      return resolve();
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.setAttribute("data-qz-src", src);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(s);
  });
}
async function waitForQZ(timeoutMs = 2500) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (window.qz) return window.qz;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("QZ Tray não disponível (window.qz).");
}
async function loadQZ() {
  if (window.qz) return window.qz;
  let lastErr = null;
  for (const src of QZ_SOURCES) {
    try {
      await injectScript(src);
      const qz = await waitForQZ(2500);
      return qz;
    } catch (e) {
      lastErr = e;
      console.warn("[QZ] Falha em", src, e?.message || e);
    }
  }
  throw lastErr || new Error("Não foi possível carregar QZ Tray.");
}

/* ==================== Helpers ==================== */
const normalize = (s) =>
  (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isAlmocoCategoria = (val) => normalize(val) === "almoco";

async function pedidoTemAlmoco(pedido) {
  // Se o item já tiver categoria, usa; senão busca em /produtos/:id
  const itens = Array.isArray(pedido?.itens) ? pedido.itens : [];
  for (const it of itens) {
    const catInline =
      it.categoria || it.category || it.Categoria || it.Category || "";
    if (catInline && isAlmocoCategoria(catInline)) return true;

    const id = it.id || it.Id || it.Sku;
    if (!id) continue;
    try {
      const snap = await getDoc(doc(db, "produtos", String(id)));
      if (snap.exists()) {
        const cat = snap.data()?.categoria || "";
        if (isAlmocoCategoria(cat)) return true;
      }
    } catch {}
  }
  return false;
}

/* ==================== Impressão (somente almoço) ==================== */
async function printIfAlmoco(pedido) {
  // Regra: nesta página **NÃO** usamos override manual.
  // Almoço => usa printerAlmoco (localStorage) ou tenta "Generic / Text Only".
  // Demais => **não imprime**.
  const temAlmoco = await pedidoTemAlmoco(pedido);
  if (!temAlmoco) return; // não imprime

  let printer = localStorage.getItem("printerAlmoco") || "";
  const fallbackName = "Generic / Text Only";

  try {
    const qz = await loadQZ();
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
    }

    // Verifica lista para garantir que a escolhida existe
    const list = await qz.printers.find();
    let chosen = "";
    if (printer && list.includes(printer)) {
      chosen = printer;
    } else if (list.includes(fallbackName)) {
      chosen = fallbackName;
    } else {
      // última tentativa: primeira que contenha "generic" no nome
      chosen = list.find((p) => /generic/i.test(p)) || "";
    }

    if (!chosen) {
      console.warn(
        "Nenhuma impressora de almoço disponível. Prosseguindo sem imprimir."
      );
      return;
    }

    const cfg = qz.configs.create(chosen);

    // Monta cupom simples
    const orderNumber = pedido?.pagamento?.orderNumber || pedido?.id;
    const linhas = [];
    linhas.push("*** PEDIDO (ONLINE) ***\n");
    linhas.push(`Nº: ${orderNumber}\n`);
    linhas.push(`Cliente: ${pedido?.nome || "-"}\n`);
    linhas.push(`Telefone: ${pedido?.telefone || "-"}\n`);
    linhas.push("\nITENS:\n");
    (pedido?.itens || []).forEach((it) => {
      const nome = it.nome || it.Name || "Item";
      const qtd = Number(it.quantidade ?? it.quantity ?? 1);
      const preco = Number(it.preco ?? it.Price ?? 0);
      linhas.push(`- ${nome}  x${qtd}  R$ ${(qtd * preco).toFixed(2)}\n`);
    });
    linhas.push("\n");
    linhas.push(`TOTAL: R$ ${Number(pedido?.total ?? 0).toFixed(2)}\n`);
    linhas.push("Pagamento: Online (aprovado)\n");
    linhas.push("\nObrigado!\n\n");

    const data = [
      { type: "raw", format: "plain", data: linhas.join("") },
      { type: "raw", format: "hex", data: "1D5600" }, // corte total
    ];
    await qz.print(cfg, data);
  } catch (e) {
    console.warn("Falha ao imprimir (almoço):", e?.message || e);
  }
}

/* ==================== Página ==================== */
export default function CheckoutReturn() {
  const navigate = useNavigate();
  const { search } = useLocation();

  const params = React.useMemo(() => new URLSearchParams(search), [search]);

  // NOVO: tenta ?order= ou fallback no localStorage('pendingOrderNumber')
  const orderNumber = React.useMemo(() => {
    const fromQuery = (params.get("order") || "").trim();
    if (fromQuery) return fromQuery;
    return (localStorage.getItem("pendingOrderNumber") || "").trim();
  }, [params]);

  const [state, setState] = React.useState({
    loading: true,
    approved: false,
    error: "",
  });

  // listeners Firestore (pedidos + checkoutIntents)
  React.useEffect(() => {
    if (!orderNumber) {
      setState({ loading: false, approved: false, error: "Pedido inválido." });
      return;
    }

    // Se já estivermos aqui, garantimos que o último número local é esse
    localStorage.setItem("lastOrderNumber", orderNumber);

    const unsubs = [];

    // 1) Observa "pedidos" por pagamento.orderNumber
    const qPedidos = query(
      collection(db, "pedidos"),
      where("pagamento.orderNumber", "==", orderNumber),
      limit(1)
    );
    unsubs.push(
      onSnapshot(
        qPedidos,
        async (snap) => {
          if (!snap.empty) {
            const docData = { id: snap.docs[0].id, ...snap.docs[0].data() };
            const status = (docData.status || "").toLowerCase();
            if (status === "aprovado") {
              // imprime se for almoço, depois redireciona
              try {
                await printIfAlmoco(docData);
              } finally {
                // NOVO: limpa storages de pendência antes de navegar
                localStorage.removeItem("pendingOrderNumber");
                localStorage.removeItem("pendingOrderSavedAt");

                setState({ loading: false, approved: true, error: "" });
                navigate(`/numero/${orderNumber}`, { replace: true });
              }
              return;
            }
            if (
              ["cancelado", "nao_aprovado", "negado", "recusado"].includes(status)
            ) {
              setState({
                loading: false,
                approved: false,
                error: "Pagamento não aprovado. Tente novamente.",
              });
              return;
            }
            // pendente => mantém aguardando
            setState((s) => ({ ...s, loading: true, approved: false, error: "" }));
          } else {
            // ainda não existe o pedido aprovado, continua observando intents
            setState((s) => ({ ...s, loading: true, approved: false, error: "" }));
          }
        },
        (err) => {
          console.error("onSnapshot(pedidos) erro:", err);
          setState({
            loading: false,
            approved: false,
            error: "Erro ao verificar status do pedido.",
          });
        }
      )
    );

    // 2) Observa "checkoutIntents" para erro explícito
    const qIntents = query(
      collection(db, "checkoutIntents"),
      where("orderNumber", "==", orderNumber),
      limit(1)
    );
    unsubs.push(
      onSnapshot(
        qIntents,
        (snap) => {
          if (!snap.empty) {
            const data = snap.docs[0].data() || {};
            const st = (data.status || "").toLowerCase();
            if (["nao_aprovado", "cancelado", "negado", "recusado"].includes(st)) {
              setState({
                loading: false,
                approved: false,
                error: "Pagamento não aprovado. Tente novamente.",
              });
            }
          }
        },
        (err) => {
          console.warn("onSnapshot(intents) erro:", err);
        }
      )
    );

    return () => {
      unsubs.forEach((u) => u && u());
    };
  }, [orderNumber, navigate]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f7f7f7",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: "center" }}>
        {state.loading && !state.error && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Processando pagamento…
            </Typography>
            <Typography sx={{ color: "#6B7280", mb: 3 }}>
              Aguarde enquanto confirmamos a aprovação do pedido.
            </Typography>
            <CircularProgress />
            <Typography sx={{ color: "#9CA3AF", mt: 2, fontSize: 12 }}>
              Nº do pedido: <b>{orderNumber || "—"}</b>
            </Typography>
          </>
        )}

        {!state.loading && state.error && (
          <Stack spacing={2} alignItems="center">
            <Alert severity="error" sx={{ textAlign: "left", width: "100%" }}>
              {state.error}
            </Alert>
            <Typography sx={{ color: "#6B7280" }}>
              O pagamento não foi aprovado. Você pode tentar novamente.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => navigate("/cardapio")}
                sx={{
                  textTransform: "none",
                  borderColor: "#F75724",
                  color: "#F75724",
                  "&:hover": { borderColor: "#e6491c", bgcolor: "#FFF1EB" },
                }}
              >
                Voltar ao cardápio
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/")}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: "#F75724",
                  "&:hover": { bgcolor: "#e6491c" },
                }}
              >
                Início
              </Button>
            </Stack>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
