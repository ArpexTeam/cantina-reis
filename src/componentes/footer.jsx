// src/componentes/footer.jsx (ou o caminho que você usa)
import React from "react";
import { Box, Container, Typography, Link } from "@mui/material";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: { xs: "auto", md: "auto" },
        px: 20,
        py: 2,
        pb: { xs: "calc(16px + env(safe-area-inset-bottom))", md: 3 },
        bgcolor: "#fff",
        borderTop: "1px solid #E5E7EB",
        boxShadow: { xs: "0 -2px 10px rgba(0,0,0,0.04)", md: "0 -2px 12px rgba(0,0,0,0.06)" },
        paddingTop: 3,
        mt: 10,
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 0.5,
          textAlign: { xs: "center", md: "left" },
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "#484848", fontSize: { xs: 12, md: 13 } }}
        >
          © {year} Todos os direitos reservados | Cardápio Digital - Cantina Reis
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: "#484848", fontSize: { xs: 12, md: 13 } }}
        >
          Desenvolvido por{" "}
          <Link
            href="https://arpex.technology"
            target="_blank"
            rel="noopener"
            underline="none"
            sx={{
              fontWeight: 700,
              color: "#F75724",
              "&:hover": { color: "#e64c1a", textDecoration: "underline" },
            }}
          >
            Arpex Technology
          </Link>
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;
