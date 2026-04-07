import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 4021;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback (Express 5: usar RegExp no lugar de "*")
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em ${PORT}`);
});
