import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Sidebar from "../../componentes/admin/sidebar";
import logo from "../../img/ChatGPT Image 23 de abr. de 2025, 20_03_44 (1) 2.svg";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../../firebase";

// Ícones
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import PeopleIcon from "@mui/icons-material/People";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";

import { getAuth } from "firebase/auth";

/* ---------- util de datas ---------- */
function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDayExclusive(d) { const x = new Date(d); x.setHours(23,59,59,999); return new Date(x.getTime() + 1); }
function startOfMonth(d) { const x = new Date(d); return new Date(x.getFullYear(), x.getMonth(), 1, 0,0,0,0); }
function addMonths(d,n){ const x = new Date(d); return new Date(x.getFullYear(), x.getMonth()+n, 1,0,0,0,0); }
function startOfYear(y){ return new Date(y,0,1,0,0,0,0); }
function startOfNextYear(y){ return new Date(y+1,0,1,0,0,0,0); }
function normalizeToDate(v){
  if(!v) return null;
  if(v instanceof Date) return v;
  if(typeof v?.toDate === "function") return v.toDate();
  if(v instanceof Timestamp) return v.toDate();
  if(typeof v === "number"){ const d=new Date(v); return isNaN(d)?null:d; }
  if(typeof v === "string"){ const d=new Date(v); return isNaN(d)?null:d; }
  return null;
}
function extractCreatedAt(data){
  const candidates = [
    data?.createdAt, data?.created_at, data?.dataHora, data?.data,
    data?.date, data?.timestamp, data?.created, data?.created_on, data?.dtCriacao,
  ];
  for(const c of candidates){ const d=normalizeToDate(c); if(d && !isNaN(d.getTime())) return d; }
  return null;
}

export default function AdminDashboard() {
  const auth = getAuth();
  console.log("Usuário atual:", auth.currentUser);

  // dados brutos
  const [pedidosRaw, setPedidosRaw] = useState([]);
  const [produtosRaw, setProdutosRaw] = useState([]);

  // KPIs
  const [totalProdutosVendidos, setTotalProdutosVendidos] = useState(0);
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [clientesAtendidos, setClientesAtendidos] = useState(0);
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState(0);

  // ---- FILTROS ----
  // tipos: "dia" | "periodo" | "mes" | "ano"
  const [tipoFiltro, setTipoFiltro] = useState("mes");

  const tz = "America/Sao_Paulo";
  const hoje = new Date();
  const hojeISO = hoje.toISOString().slice(0,10); // YYYY-MM-DD
  const mesAtualISO = hoje.toISOString().slice(0,7); // YYYY-MM

  // DIA
  const [diaSelecionado, setDiaSelecionado] = useState(hojeISO);

  // PERÍODO
  const [dataInicio, setDataInicio] = useState(startOfMonth(hoje).toISOString().slice(0,10));
  const [dataFim, setDataFim] = useState(hojeISO);

  // MÊS
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualISO);

  // ANO
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear());

  // intervalo aplicado [ini, fim)
  const [rangeAplicado, setRangeAplicado] = useState(() => {
    const ini = startOfMonth(hoje);
    const fim = addMonths(ini,1);
    return { ini, fim };
  });

  function parseLocalDateFromISO(isoDate /* "YYYY-MM-DD" */) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0); // local midnight
}
function parseLocalMonthFromISO(isoMonth /* "YYYY-MM" */) {
  if (!isoMonth) return null;
  const [y, m] = isoMonth.split("-").map(Number);
  return new Date(y, m - 1, 1, 0, 0, 0, 0); // 1º dia do mês, local
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}


  // helpers de negócio
  const isApprovedStatus = (s) => {
    const t = String(s ?? "").toLowerCase();
    return (
      ["pago","aprovado","approved","paid","capturado","captured","autorizado","authorized"]
        .some(k => t.includes(k)) || t === "2"
    );
  };
  const getQty = (item) => Number(item?.quantidade ?? item?.quantity ?? item?.qtd ?? 0);
  const getUnitPrice = (item) => Number(item?.precoSelecionado ?? item?.preco ?? item?.price ?? 0);

  // fetch 1x
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const pedidosSnap = await getDocs(collection(db, "pedidos"));
        setPedidosRaw(pedidosSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const produtosSnap = await getDocs(collection(db, "produtos"));
        setProdutosRaw(produtosSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Erro no bootstrap do dashboard:", e);
      }
    };
    bootstrap();
  }, []);

  // recalcula KPIs quando range/dados mudam
  useEffect(() => {
    if(!rangeAplicado?.ini || !rangeAplicado?.fim) return;

    let totalVendasAprov = 0;
    let totalProdutosAprov = 0;
    let pedidosAprovados = 0;
    const clientesAprov = new Set();

    for(const pedido of pedidosRaw){
      if(!isApprovedStatus(pedido?.status)) continue;
      const created = extractCreatedAt(pedido);
      if(!created) continue;
      if(created >= rangeAplicado.ini && created < rangeAplicado.fim){
        pedidosAprovados++;
        if(Array.isArray(pedido.itens) && pedido.itens.length){
          for(const item of pedido.itens){
            const q = getQty(item);
            const p = getUnitPrice(item);
            totalProdutosAprov += q;
            totalVendasAprov += q * p;
          }
        } else if(!isNaN(Number(pedido.total))){
          totalVendasAprov += Number(pedido.total);
        }
        const chaveCliente =
          pedido.telefone ?? pedido.cliente?.fone ?? pedido.cliente?.telefone ??
          pedido.cliente?.email ?? pedido.cliente?.cpf ?? pedido.userId;
        if(chaveCliente) clientesAprov.add(String(chaveCliente));
      }
    }

    setTotalProdutosVendidos(totalProdutosAprov);
    setTotalVendas(totalVendasAprov);
    setTotalPedidos(pedidosAprovados);
    setTicketMedio(pedidosAprovados ? totalVendasAprov / pedidosAprovados : 0);
    const produtosBaixo = produtosRaw.filter(p => {
      const e = Number(p.estoque ?? 0);
      const m = Number(p.estoqueMin ?? p.estoqueMinimo ?? 0);
      return !isNaN(e) && !isNaN(m) && e <= m;
    }).length;
    setClientesAtendidos(clientesAprov.size);
    setProdutosBaixoEstoque(produtosBaixo);
  }, [pedidosRaw, produtosRaw, rangeAplicado]);

  // aplicar/limpar
const aplicarFiltro = () => {
  if (tipoFiltro === "dia") {
    if (!diaSelecionado) return;
    const base = parseLocalDateFromISO(diaSelecionado);
    const ini = base;              // 00:00 local do dia escolhido
    const fim = addDays(base, 1);  // exclusivo: começo do dia seguinte
    setRangeAplicado({ ini, fim });
    return;
  }

  if (tipoFiltro === "periodo") {
    if (!dataInicio || !dataFim) return;
    const iniBase = parseLocalDateFromISO(dataInicio);
    const fimBase = parseLocalDateFromISO(dataFim);
    if (!iniBase || !fimBase) return;
    const ini = new Date(iniBase.getFullYear(), iniBase.getMonth(), iniBase.getDate(), 0, 0, 0, 0);
    const fim = addDays(new Date(fimBase.getFullYear(), fimBase.getMonth(), fimBase.getDate(), 0, 0, 0, 0), 1);
    setRangeAplicado({ ini, fim });
    return;
  }

  if (tipoFiltro === "mes") {
    if (!mesSelecionado) return;
    const ini = parseLocalMonthFromISO(mesSelecionado);
    const fim = addMonths(ini, 1); // já existe no seu código
    setRangeAplicado({ ini, fim });
    return;
  }

  if (tipoFiltro === "ano") {
    const y = parseInt(anoSelecionado, 10);
    if (!y || isNaN(y)) return;
    const ini = startOfYear(y);
    const fim = startOfNextYear(y);
    setRangeAplicado({ ini, fim });
  }
};


  const limparFiltro = () => {
    setTipoFiltro("mes");
    const ini = startOfMonth(new Date());
    const fim = addMonths(ini, 1);
    setDiaSelecionado(hojeISO);
    setDataInicio(ini.toISOString().slice(0,10));
    setDataFim(hojeISO);
    setMesSelecionado(mesAtualISO);
    setAnoSelecionado(new Date().getFullYear());
    setRangeAplicado({ ini, fim });
  };

  const legendaPeriodo = useMemo(() => {
    const { ini, fim } = rangeAplicado;
    if(!ini || !fim) return "";
    const fmt = (d) => d.toLocaleDateString("pt-BR", { timeZone: tz });
    return `${fmt(ini)} a ${fmt(new Date(fim.getTime()-1))}`;
  }, [rangeAplicado]);

  const cards = [
    { icon: <ShoppingCartIcon className="CardIcon" sx={{ fontSize: 40, color: "#4B5563" }}/>, label: "Produtos vendidos", value: totalProdutosVendidos },
    { icon: <AttachMoneyIcon className="CardIcon" sx={{ fontSize: 40, color: "#4B5563" }}/>, label: "Total arrecadado", value: `R$ ${totalVendas.toFixed(2)}` },
    { icon: <LocalOfferIcon className="CardIcon" sx={{ fontSize: 40, color: "#4B5563" }}/>, label: "Pedidos aprovados", value: totalPedidos },
    { icon: <TrendingUpIcon className="CardIcon" sx={{ fontSize: 40, color: "#4B5563" }}/>, label: "Ticket médio", value: `R$ ${ticketMedio.toFixed(2)}` },
    { icon: <PeopleIcon className="CardIcon" sx={{ fontSize: 40, color: "#4B5563" }}/>, label: "Clientes atendidos", value: clientesAtendidos },
    { icon: <WarningIcon className="CardIcon" sx={{ fontSize: 40, color: "#4B5563" }}/>, label: "Estoque baixo", value: produtosBaixoEstoque },
  ];

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, bgcolor: "#F1F1F1", minHeight: 600 }}>
        {/* Header */}
        <Box
          sx={{
            width: "100%", height: 80, px: 4,
            backgroundColor: "#000", color: "#FFF",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            boxSizing: "border-box", position: "absolute", left: 0, zIndex: 10,
          }}
        >
          <Box sx={{ height: 70, width: "auto" }}>
            <img src={logo} alt="Logo" style={{ width: "100%", height: "100%" }} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Avatar src="https://via.placeholder.com/150" />
            <Typography component="span" sx={{ display: "inline-flex" }}>Administrador</Typography>
          </Box>
        </Box>

        {/* Conteúdo principal */}
        <Box sx={{ p: 4, mt: 10 }}>
          <Typography variant="h6" fontWeight="bold" textAlign="center" sx={{ fontFamily: "Poppins, sans-serif" }}>
            Painel de controle
          </Typography>
          <Box sx={{ borderBottom: "2px solid black", width: "100%", mt: 1, mb: 3 }} />

          {/* Barra de Filtros (visual refinado) */}
          <Paper
            elevation={3}
            sx={{
              p: 2.5, mb: 4, borderRadius: 2,
              background: "#fff",
              border: "1px solid #E6E6E6",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* barra lateral/acento */}
            <Box sx={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: 6,
              background: "#FF6B2C",
            }}/>

            <Stack spacing={2}>
              {/* Toggle estilizado para o tipo de filtro */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography sx={{ fontWeight: 600, fontFamily: "Poppins, sans-serif" }}>
                  Filtros de data
                </Typography>
                <Divider flexItem orientation="vertical" />
                <ToggleButtonGroup
                  exclusive
                  value={tipoFiltro}
                  onChange={(_, v) => v && setTipoFiltro(v)}
                  sx={{
                    "& .MuiToggleButton-root": {
                      textTransform: "none",
                      borderRadius: 2,
                      px: 2,
                      borderColor: "#E6E6E6",
                      fontWeight: 600,
                      fontFamily: "Poppins, sans-serif",
                    },
                    "& .Mui-selected": {
                      backgroundColor: "#FF6B2C !important",
                      color: "#fff",
                      borderColor: "#FF6B2C",
                    },
                  }}
                >
                  <ToggleButton value="dia">Dia</ToggleButton>
                  <ToggleButton value="periodo">Período</ToggleButton>
                  <ToggleButton value="mes">Mês</ToggleButton>
                  <ToggleButton value="ano">Ano</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {/* Inputs dinâmicos */}
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", md: "flex-end" }}
              >
                {tipoFiltro === "dia" && (
                  <TextField
                    label="Dia"
                    type="date"
                    value={diaSelecionado}
                    onChange={(e) => setDiaSelecionado(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 200 }}
                  />
                )}

                {tipoFiltro === "periodo" && (
                  <>
                    <TextField
                      label="Início"
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Fim"
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </>
                )}

                {tipoFiltro === "mes" && (
                  <TextField
                    label="Mês"
                    type="month"
                    value={mesSelecionado}
                    onChange={(e) => setMesSelecionado(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 200 }}
                  />
                )}

                {tipoFiltro === "ano" && (
                  <TextField
                    label="Ano"
                    type="number"
                    value={anoSelecionado}
                    onChange={(e) => setAnoSelecionado(e.target.value)}
                    InputProps={{ inputProps: { min: 2000, max: 2100 } }}
                    sx={{ minWidth: 140 }}
                  />
                )}

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={aplicarFiltro}
                    sx={{
                      bgcolor: "#FF6B2C",
                      "&:hover": { bgcolor: "#e15f28" },
                      fontWeight: 700,
                    }}
                  >
                    Aplicar
                  </Button>
                  <Button variant="outlined" onClick={limparFiltro} sx={{ borderColor: "#D1D5DB" }}>
                    Limpar
                  </Button>
                </Stack>

                <Box flex={1} />

                <Chip
                  label={`Intervalo: ${legendaPeriodo}`}
                  sx={{
                    fontWeight: 600,
                    bgcolor: "#F6F7F9",
                    border: "1px solid #E5E7EB",
                  }}
                />
              </Stack>
            </Stack>
          </Paper>

          {/* Cards */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 4,
              maxWidth: "1200px",
              mx: "auto",
            }}
          >
            {cards.map((item, index) => (
              <Box key={index} sx={{ flex: "1 1 calc(33.333% - 32px)", minWidth: "250px", maxWidth: "300px" }}>
                <Paper
                  elevation={4}
                  sx={{
                    p: 0,
                    display: "flex",
                    alignItems: "stretch",
                    bgcolor: "#fff",
                    borderRadius: 2,
                    height: 160,
                    minWidth: 220,
                    maxWidth: 350,
                    boxShadow: "0 2px 10px 0 rgba(0,0,0,0.07)",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.22s cubic-bezier(.4,2,.3,1), box-shadow 0.2s, border 0.22s",
                    border: "2px solid #fff",
                    "&:hover": {
                      boxShadow: "0 6px 28px 0 rgba(255,107,44,0.14), 0 1.5px 12px 0 rgba(0,0,0,0.08)",
                      border: "2px solid #FFF",
                      transform: "scale(1.035) translateY(-3px)",
                      ".CardOrange": { filter: "brightness(1.1) drop-shadow(0 0 6px #FF6B2C55)" },
                      ".CardIcon": { color: "#fff", filter: "drop-shadow(0 0 8px #fff5)" },
                    },
                  }}
                >
                  {/* Lateral laranja */}
                  <Box
                    className="CardOrange"
                    sx={{
                      width: 70,
                      height: "100%",
                      minWidth: 70,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      background: "#FF6B2C",
                      borderRadius: "0 150px 150px 0 / 0 100% 100% 0",
                      boxShadow: "0 0 12px #FF6B2C22",
                      zIndex: 1,
                    }}
                  >
                    <Box className="CardIcon" sx={{ position: "relative", zIndex: 2, fontSize: 32, color: "#fff", transition: "color 0.22s, filter 0.22s" }}>
                      {React.cloneElement(item.icon, { sx: { fontSize: 36, color: "inherit" } })}
                    </Box>
                  </Box>

                  {/* Conteúdo */}
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 1, px: 2, textAlign: "center" }}>
                    <Typography variant="subtitle1" fontWeight={400} fontSize="16px" sx={{ fontFamily: "Poppins, sans-serif", mb: 0.5 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h6" fontSize="32px" fontWeight={800} sx={{ fontFamily: "Poppins, sans-serif", lineHeight: 1, letterSpacing: "1px" }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
