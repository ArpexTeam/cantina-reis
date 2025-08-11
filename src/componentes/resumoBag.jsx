import React from "react";
import { Box, Typography, Button, Menu, MenuItem } from "@mui/material";
import { KeyboardArrowDown } from "@mui/icons-material";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const tiposServico = ["No local", "Agendar"];

const ResumoBag = ({ quantidade, total, servico, onSelect }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const navigate = useNavigate();

  const finalizarPedido = async () => {
    if (!servico) {
      alert("Selecione o tipo de serviço!");
      return;
    }

    if (servico === "Agendar") {
      navigate("/agendar");
      return;
    }

    try {
      const sacola = JSON.parse(localStorage.getItem("sacola")) || [];
      if (sacola.length === 0) {
        alert("Sacola vazia!");
        return;
      }

      // Busca no Firestore
      const produtoId = sacola[0].id;
      const produtoRef = doc(db, "produtos", produtoId);
      const produtoSnap = await getDoc(produtoRef);

      if (!produtoSnap.exists()) {
        alert("Produto não encontrado no banco!");
        return;
      }

      const produtoData = produtoSnap.data();

      // Substitua a parte que monta dadosNFE
      const produtos = sacola.map((item) => ({
        cProd: String(item.codigo || item.id || "001"),
        cEAN: String(item.cEAN || "SEM GTIN"),
        xProd: String(item.nome || "Produto Sem Nome"),
        NCM: String(produtoData.ncm || "00000000"),
        CFOP: String(produtoData.cfop || "5102"),
        uCom: String(produtoData.unidade || "UN"),
        // envie números (sem toFixed), a API formata
        qCom: Number(item.quantity || 1),
        vUnCom: Number(item.precoSelecionado ?? item.preco ?? 0),
        cEANTrib: String(item.cEANTrib || "SEM GTIN"),
        orig: Number(produtoData.origem ?? 0),
        CST: String(produtoData.cst_icms ?? "00"),
        pICMS: Number(produtoData.aliquota_icms ?? 18),   // ajuste às suas regras
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
        produtos, // <<<<<<<<<<<<<< essencial
      };

        const resp = await fetch("https://nfe-emissor.onrender.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosNFE),
      });
      const nf = await resp.json();
      console.log("Retorno NF-e:", nf); // para diagnosticar

      if (nf.status !== "sucesso") {
        console.error("Erro na emissão da NF-e:", nf.mensagem);
        alert("Erro ao emitir NF-e!");
        return;
      }

      // Salva pedido com NF-e
      await addDoc(collection(db, "pedidos"), {
        createdAt: serverTimestamp(),
        itens: sacola,
        status: "pendente",
        tipoServico: servico,
        total,
        nfe: {
          chave: nf.chave,
          danfeBase64: nf.danfeBase64,
          xmlBase64: nf.xmlBase64
        }
      });

      alert("Pedido salvo e NF-e emitida com sucesso!");
      localStorage.removeItem("sacola");
      navigate("/cardapio");

    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar pedido!");
    }
  };

  return (
    <Box
      id="resumoPedido"
      sx={{
        paddingX: 2,
        paddingY: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        width: "100%",
        borderTop: "2px solid #D9D9D9",
        position: "fixed",
        bottom: quantidade > 0 ? 0 : "-120px",
        left: 0,
        transition: "all 0.3s ease-in-out",
        zIndex: 10,
      }}
    >
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "12px" }}>
          Sua sacola
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "13px" }}>
          R$ {total.toFixed(2)}
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
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "6px",
            fontSize: "12px",
          }}
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
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "6px",
            fontSize: "12px",
          }}
          onClick={finalizarPedido}
        >
          Finalizar compra
        </Button>
      </Box>
    </Box>
  );
};

export default ResumoBag;
