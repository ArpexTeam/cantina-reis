import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { Add, Remove, Delete } from "@mui/icons-material";

const BagItem = ({
  nome,
  descricao, 
  precoSelecionado, 
  imagem, 
  quantity,
  onAdd,
  onRemove,
  onDelete
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        maxWidth: "800px",
        padding: "16px",
        backgroundColor: "#fff",
        borderRadius: "10px",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
        height: "200px",
        marginTop: "40px",
      }}
    >
      {/* Imagem */}
      <Box
        sx={{
          width: "40%",
          height: "100%",
          backgroundImage: `url(${imagem})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: "8px",
        }}
      ></Box>

      {/* Conteúdo */}
      <Box
        sx={{
          width: "60%",
          paddingLeft: "16px",
          textAlign: "left",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "#333", fontSize: "15px" }}
        >
          {nome}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#777",
            marginTop: "8px",
            fontSize: "12px",
          }}
        >
          {descricao}
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, fontSize: "16px" }}
          >
            R${(precoSelecionado || 0).toFixed(2)}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton size="small" onClick={onDelete}>
              <Delete fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onRemove}>
              <Remove fontSize="small" />
            </IconButton>
            <Typography sx={{ fontSize: "14px", fontWeight: "bold" }}>
              {quantity}
            </Typography>
            <IconButton size="small" onClick={onAdd}>
              <Add fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default BagItem;
