import React from "react";
import { Button, Container, Typography, Box } from "@mui/material";

function Footer({ title, description, price, onAdd }) {
  return (

      <Box
        sx={{
          display: "flex",
          flexDirection: "column", // Alinhar horizontalmente
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          padding: "16px",
          backgroundColor: "#fff",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
            <Typography variant="h6" sx={{ color: "#484848", fontSize:"12px" }}>
                Cardápio digital Cantina Reis 
            </Typography>
            <Typography variant="body2" sx={{ color: "#484848", marginTop: "1px", fontSize:"12px" }}>
                Desenvolvido por <a style={{fontWeight:'600'}}>Arpex Technology</a>
            </Typography>
      </Box>
  );
}

export default Footer;
