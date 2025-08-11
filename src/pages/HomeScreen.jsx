import React from "react";
import { Button, Container, Typography } from "@mui/material";
import { Box } from "@mui/system";
import logo from '../img/ChatGPT Image 23 de abr. de 2025, 20_03_44 (1) 2.svg';
import background from '../img/image.jpg';
import { Link } from 'react-router-dom';


function HomeScreen() {
  return (
    <Container
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundImage: `url(${background})`, // Cor de fundo mais escura
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "transparent",
          padding: "20px",
          borderRadius: "15px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
        }}
      >
        <img
          src={logo} // Coloque o caminho do logo aqui
          alt="Cantina Reis"
          style={{ width: "320px", height: "auto", marginBottom: "20px" }}
        />


        <Button
          variant="contained"
          component={Link}
          to="/cardapio"
          sx={{
            backgroundColor: "#F75724", // Cor laranja
            color: "white",
            width: "250px",
            marginBottom: "15px",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 600,
            fontSize: "15px",
            textTransform: "none", // Removendo a transformação para maiúsculas

            "&:hover": {
              backgroundColor: "#D24C1A", // Tom mais escuro ao passar o mouse
            },
          }}
        >
          Visualizar Menu
        </Button>

        <Button
          variant="contained"
          sx={{
            backgroundColor: "#F75724", // Cor laranja
            color: "white",
            width: "250px",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 600,
            fontSize: "15px",
            textTransform: "none", // Removendo a transformação para maiúsculas

            "&:hover": {
              backgroundColor: "#D24C1A", // Tom mais escuro ao passar o mouse
            },
          }}
          onClick={() => window.open("https://wa.me/5511999999999", "_blank")} // Substitua pelo número correto do WhatsApp
        >
          WhatsApp
        </Button>
      </Box>
    </Container>
  );
}

export default HomeScreen;