import express from "express";
import path from "path";

const app = express();
const PORT = 4021;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback (para rotas do Vite)
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em ${PORT}`);
});
