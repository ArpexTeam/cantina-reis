import React from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { Add, Remove, Delete } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import trash from '../img/trashIcon.svg';


const formatBRL = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(n ?? 0)
  );

const BagItem = ({
  nome,
  descricao,
  precoSelecionado,
  imagem,
  quantity,
  onAdd,
  onRemove,
  onDelete,
}) => {
  return (
   <Box
      role="button"
      tabIndex={0}

      sx={{
        display: "grid",
        gridTemplateColumns: "158px 2fr 50px",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        bgcolor: "#FFFFFF",
        border: "1px solid #E6E6E6",
        borderRadius: "5px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        p: "6px",
        cursor: "pointer",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Imagem */}
      <Box sx={{ width: "158px", height: "100px", borderRadius: "5px", overflow: "hidden" }}>
        <img
          src={imagem}
          alt={nome}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </Box>

      {/* Texto */}
      <Box sx={{ minWidth: 0, textAlign:'left',}}>
        <Typography
          title={nome}
          sx={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 600,
            fontSize: "12px",
            color: "#111827",
            lineHeight: 1.2,
            mb: "6px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            
          }}
        >
          {nome}
        </Typography>

        {descricao ? (
          <Typography
            sx={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 300,
              fontSize: "13px",
              color: "#4B5563",
              lineHeight: 1.35,
              mb: "10px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {descricao}
          </Typography>
        ) : null}

        <Typography
          sx={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            color: "#111827",
          }}
        >
            {formatBRL(precoSelecionado)}

             </Typography>
      </Box>

      <Box sx={{
          marginTop:6,
          display:'flex',
          alignItems:'center',
          justifyContent:'space-around',
          gap:1,
          marginRight:3,
      }}>
        <img src={trash} onClick={onDelete}/>
        <Typography
           sx={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            color: "#111827",
          }}>{quantity}</Typography>

             <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onAdd?.();
        }}
        sx={{
          justifySelf: "end",
          alignSelf: "center",
          height: 32,
          color: "#e64c1a",
          margin:0,
          padding:0,
        }}
      >
        <AddIcon sx={{ fontSize: 18, margin:0 }} />
      </IconButton>
      </Box>
 
    </Box>
  );
};

export default BagItem;
