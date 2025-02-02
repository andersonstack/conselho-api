import express from "express";
import cors from "cors";
import db from "./database.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Criar um novo usuário
app.post("/users", async (req, res) => {
  try {
    const { userName, name, senha } = req.body;

    db.run(
      "INSERT INTO users (userName, name, senha) VALUES (?, ?, ?)",
      [userName, name, senha],
      function (err) {
        if (err) {
          return res.status(409).json({ message: "Usuário já existe" });
        }
        res
          .status(201)
          .json({ message: "Usuário criado com sucesso", id: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar usuário" });
  }
});

// Fazer login
app.post("/login", (req, res) => {
  const { userName, senha } = req.body;

  db.get(
    "SELECT * FROM users WHERE userName = ?",
    [userName],
    async (err, user) => {
      if (err || !user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const isPasswordValid = await bcrypt.compare(senha, user.senha);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Senha inválida" });
      }

      res.status(200).json({
        message: "Login bem-sucedido",
        user: { id: user.id, userName: user.userName },
      });
    }
  );
});

// Adicionar frase
app.post("/users/:id/frases", (req, res) => {
  const { id } = req.params;
  const { fraseKey, fraseValue } = req.body;

  db.run(
    "INSERT INTO frases (userId, fraseKey, fraseValue) VALUES (?, ?, ?)",
    [id, fraseKey, fraseValue],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Erro ao adicionar frase" });
      }
      res
        .status(201)
        .json({ message: "Frase adicionada com sucesso", id: this.lastID });
    }
  );
});

// Buscar frases do usuário
app.get("/users/:id/frases", (req, res) => {
  const { id } = req.params;

  db.all(
    "SELECT fraseKey, fraseValue FROM frases WHERE userId = ?",
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao buscar frases" });
      }
      res.status(200).json({ message: "Frases encontradas", data: rows });
    }
  );
});

// Remover uma frase
app.delete("/users/:id/frases/:fraseKey", (req, res) => {
  const { id, fraseKey } = req.params;

  db.run(
    "DELETE FROM frases WHERE userId = ? AND fraseKey = ?",
    [id, fraseKey],
    function (err) {
      if (err || this.changes === 0) {
        return res.status(404).json({ message: "Frase não encontrada" });
      }
      res.status(200).json({ message: "Frase removida com sucesso" });
    }
  );
});

// Listar todos os usuários
app.get("/users", (req, res) => {
  db.all("SELECT id, userName, name FROM users", (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Erro ao buscar usuários" });
    }
    res.status(200).json({ data: rows });
  });
});

// Deletar todos os usuários
app.delete("/users", (req, res) => {
  db.run("DELETE FROM users", (err) => {
    if (err) {
      return res.status(500).json({ message: "Erro ao deletar usuários" });
    }
    res.status(200).json({ message: "Usuários deletados com sucesso" });
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
