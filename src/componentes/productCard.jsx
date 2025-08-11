import React from "react";
import { Box, Typography, Button } from "@mui/material";

const ProductCard = ({ produto, onAdd, onView }) => {
  const { nome, descricao, imagem } = produto;

  return (
    <Box
      onClick={onView} // TODO: abre página individual
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
        cursor: "pointer",
      }}
    >
      {/* Imagem */}
  <Box sx={{ width: '60%', aspectRatio: '3/3', borderRadius: '8px', overflow: 'hidden' }}>
    <img
      src={imagem}
      alt="Produto"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
        display: 'block',
      }}
    />
  </Box>

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
          sx={{ color: "#777", marginTop: "8px", fontSize: "12px" }}
        >
          {descricao}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            marginTop: "16px",
          }}
        >
          <Button
            onClick={(e) => {
              e.stopPropagation(); // 🛑 NÃO abre página individual
              onAdd();
            }}
            sx={{
              backgroundColor: "#FF5722",
              color: "#fff",
              borderRadius: "10px",
              padding: "4px 14px",
              fontSize: "20px",
              fontWeight: "bold",
              minWidth: "40px",
              "&:hover": { backgroundColor: "#e64a19" },
            }}
          >
            +
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ProductCard;
