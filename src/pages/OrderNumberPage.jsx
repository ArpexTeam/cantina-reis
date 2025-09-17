// src/pages/OrderNumberPage.jsx
import React from "react";
import {
  Box,
  Container,
  Typography,
  IconButton,
  Button,
  Stack,
  Tooltip,
  Alert,
  Snackbar,
} from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useNavigate, useParams } from "react-router-dom";
import vendedora from "../img/Balconista.png";

import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/* ============ QZ helpers ============ */
const QZ_CDNS = [
  "https://cdnjs.cloudflare.com/ajax/libs/qz-tray/2.1.0/qz-tray.js",
  "/qz-tray.js",
];
function injectScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-qz-src="${src}"]`) || document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.async = true; s.defer = true;
    s.setAttribute("data-qz-src", src);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Falha ao carregar script: ${src}`));
    document.head.appendChild(s);
  });
}
async function waitForQZ(timeoutMs = 2500) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (window.qz) return window.qz;
    await new Promise(r => setTimeout(r, 50));
  }
  throw new Error("QZ Tray não ficou disponível.");
}
async function loadQZ() {
  if (window.qz) return window.qz;
  let lastErr = null;
  for (const src of QZ_CDNS) {
    try {
      await injectScript(src);
      return await waitForQZ(2500);
    } catch (e) { lastErr = e; }
  }
  throw new Error(`QZ Tray não carregou: ${lastErr?.message || lastErr}`);
}

/* ============ utils ============ */
const normalize = (s) =>
  (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const formatBRL = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

/* ============ Ilustração ============ */
const Illo = () => (
  <svg width="180" height="120" viewBox="0 0 300 200" role="img" aria-label="Atendente no caixa">
    <rect x="0" y="170" width="300" height="12" fill="#F75724" />
    <rect x="40" y="140" width="220" height="35" rx="6" fill="#DDDDDD" />
    <circle cx="95" cy="105" r="22" fill="#F4B183" />
    <rect x="78" y="120" width="34" height="24" rx="8" fill="#F75724" />
    <rect x="120" y="120" width="120" height="14" rx="3" fill="#C9CDD4" />
    <rect x="120" y="138" width="80" height="9" rx="3" fill="#E3E6EC" />
    <polygon points="210,70 260,55 260,90" fill="#FF8A5B" />
  </svg>
);

export default function OrderNumberPage() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();

  const num = (orderNumber || "").toString().toUpperCase();

  // estado do pedido
  const [pedido, setPedido] = React.useState(null);
  const produtosMapRef = React.useRef(new Map());
  const printedRef = React.useRef(false);

  // guarda “último número”
  React.useEffect(() => {
    if (num) {
      localStorage.setItem("lastOrderNumber", num);
      localStorage.setItem("lastOrderSavedAt", new Date().toISOString());
    }
  }, [num]);

  // mapa produto->categoria (fallback)
  React.useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "produtos"));
        const map = new Map();
        snap.docs.forEach(d => map.set(d.id, (d.data()?.categoria || "").toString()));
        produtosMapRef.current = map;
      } catch (e) {
        console.warn("Falha ao carregar produtos:", e?.message || e);
      }
    })();
  }, []);

  // observa o pedido pelo orderNumber
  React.useEffect(() => {
    if (!orderNumber) {
      const last = localStorage.getItem("lastOrderNumber");
      if (last) navigate(`/numero/${last}`, { replace: true });
      return;
    }

    const qy = query(collection(db, "pedidos"), where("pagamento.orderNumber", "==", orderNumber));
    const unsub = onSnapshot(qy, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const p = docs[0];

      // BLOQUEIO: se não há pedido OU não está aprovado, NÃO pode ficar nessa página
      if (!p || p.status !== "aprovado") {
        navigate("/cardapio", { replace: true });
        return;
      }

      setPedido(p);
    });
    return () => unsub();
  }, [orderNumber, navigate]);

  const hasAlmoco = (p) =>
    (p?.itens || []).some((it) => {
      const catItem = (it.categoria || it.category || "").toString();
      const catByMap = produtosMapRef.current.get(it.id) || "";
      return normalize(catItem || catByMap) === "almoco";
    });

  // impressora por CATEGORIA (NÃO usa override aqui)
  const choosePrinterByCategory = async (p) => {
    const printerGeralSaved = localStorage.getItem("printerGeral") || "";
    const printerAlmocoSaved = localStorage.getItem("printerAlmoco") || "";

    const qz = await loadQZ();
    if (!qz.websocket.isActive()) await qz.websocket.connect();
    const list = await qz.printers.find();

    const pick = (want) => (want && list.includes(want) ? want : "");
    const generic = list.find((x) => /^generic\s*\/\s*text\s*only$/i.test(x)) || "";
    const elgin = list.find((x) => /elgin/i.test(x)) || "";
    const any = list[0] || "";

    if (hasAlmoco(p)) {
      return pick(printerAlmocoSaved) || generic || any;
    }
    // demais categorias: NENHUMA impressora (não imprime)
    return null;
  };

  const autoPrintIfNeeded = React.useCallback(async (p) => {
    if (!p || printedRef.current) return;
    if (!hasAlmoco(p)) return; // só imprime "Almoço"

    try {
      const qz = await loadQZ();
      const chosen = await choosePrinterByCategory(p);
      if (!chosen) return; // não há impressora => não imprime

      const cfg = qz.configs.create(chosen);

      const linhas = [];
      const onum = p?.pagamento?.orderNumber || p?.id || num;
      linhas.push("*** PEDIDO ***\n");
      linhas.push(`Nº: ${onum}\n`);
      linhas.push(`Cliente: ${p?.nome || "-"}\n`);
      linhas.push(`Telefone: ${p?.telefone || "-"}\n`);
      linhas.push("\nITENS:\n");
      (p?.itens || []).forEach((it) => {
        const nome = it.nome || it.Name || "Item";
        const qtd = Number(it.quantidade ?? it.quantity ?? 1);
        const preco = Number(it.preco ?? it.Price ?? 0);
        linhas.push(`- ${nome}  x${qtd}  R$ ${(qtd * preco).toFixed(2)}\n`);
      });
      linhas.push("\n");
      linhas.push(`TOTAL: ${formatBRL(p?.total)}\n`);
      linhas.push(`Pagamento: ${p?.pagamento?.tipo || "online"}\n`);
      linhas.push("\nObrigado!\n\n");

      const data = [
        { type: "raw", format: "plain", data: linhas.join("") },
        { type: "raw", format: "hex", data: "1D5600" }, // corte total
      ];

      await qz.print(cfg, data);
      printedRef.current = true;
      localStorage.setItem(`printedOnline-${num}`, "1");
    } catch (err) {
      console.warn("Auto-print falhou:", err?.message || err);
    }
  }, [num]);

  // dispare a auto-impressão uma única vez quando o pedido aprovado chegar
  React.useEffect(() => {
    if (!pedido) return;
    const already = localStorage.getItem(`printedOnline-${num}`);
    if (already) return;
    autoPrintIfNeeded(pedido);
  }, [pedido, num, autoPrintIfNeeded]);

  /* ======== UI ======== */
  const [copied, setCopied] = React.useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(num); setCopied(true); } catch {} };
  const printPage = () => window.print();
  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Meu número de pedido é: ${num}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f7f7", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <Box sx={{ position: "sticky", top: 0, bgcolor: "#fff", borderBottom: "1px solid #E5E7EB", zIndex: 10 }}>
        <Container maxWidth="sm" sx={{ display: "flex", alignItems: "center", py: 1 }}>
          <IconButton onClick={() => navigate(-1)} size="small"><ArrowBackIosNewRoundedIcon fontSize="small" /></IconButton>
          <Typography sx={{ flex: 1, textAlign: "center", fontWeight: 700 }}>Número do pedido</Typography>
          <IconButton onClick={() => navigate("/")} size="small" aria-label="Fechar"><CloseRoundedIcon fontSize="small" /></IconButton>
        </Container>
      </Box>

      {/* Conteúdo */}
      <Container maxWidth="sm" sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", py: 4, gap: 2 }}>
        {num && (
          <Alert severity="info" variant="outlined" sx={{ width: "100%", borderRadius: 2, borderColor: "#93C5FD", bgcolor: "#EFF6FF" }}>
            Guarde seu número para acompanhamento. Você pode copiar, imprimir ou enviar por WhatsApp.
          </Alert>
        )}

        <Typography variant="body1" sx={{ color: "#6B7280", fontWeight: 500 }}>
          Aguarde ser chamado pelo número do seu pedido!
        </Typography>

        <Typography sx={{ fontWeight: 800, letterSpacing: 0.3, color: "#111827" }}>
          NÚMERO DO PEDIDO É:
        </Typography>

        <Typography component="div" sx={{ fontSize: { xs: 64, sm: 72 }, lineHeight: 1, fontWeight: 900, color: "#000" }}>
          {num || "— — — — —"}
        </Typography>

        {/* Ações */}
        {num && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Tooltip title="Copiar">
              <Button
                variant="outlined"
                onClick={copy}
                startIcon={<ContentCopyRoundedIcon />}
                sx={{ textTransform: "none", borderColor: "#F75724", color: "#F75724", "&:hover": { borderColor: "#e6491c", bgcolor: "#FFF1EB" } }}
              >
                Copiar
              </Button>
            </Tooltip>

            {/* imprime a PÁGINA (número grande). A impressão automática do cupom já foi feita quando for Almoço */}
            <Tooltip title="Imprimir esta página">
              <Button
                variant="outlined"
                onClick={printPage}
                startIcon={<PrintRoundedIcon />}
                sx={{ textTransform: "none", borderColor: "#F75724", color: "#F75724", "&:hover": { borderColor: "#e6491c", bgcolor: "#FFF1EB" } }}
              >
                Imprimir
              </Button>
            </Tooltip>

            <Tooltip title="Enviar por WhatsApp">
              <Button
                variant="contained"
                onClick={shareWhatsApp}
                startIcon={<WhatsAppIcon />}
                sx={{ textTransform: "none", fontWeight: 800, bgcolor: "#22c55e", "&:hover": { bgcolor: "#16a34a" } }}
              >
                WhatsApp
              </Button>
            </Tooltip>
          </Stack>
        )}

        <Box sx={{ mt: 2 }}>
          <img src={vendedora} width={200} alt="Atendente" />
        </Box>

        <Typography sx={{ color: "#6B7280", fontWeight: 600, mt: 1 }}>
          Agradecemos sua preferência.
          <br />
          Tenha uma ótima refeição!
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate("/cardapio")}
          sx={{ mt: 2, textTransform: "none", fontWeight: 800, bgcolor: "#F75724", "&:hover": { bgcolor: "#e6491c" }, borderRadius: 1, px: 2.5 }}
        >
          Voltar ao cardápio
        </Button>
      </Container>

      <Snackbar
        open={copied}
        autoHideDuration={1800}
        onClose={() => setCopied(false)}
        message="Número copiado!"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
