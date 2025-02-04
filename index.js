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

    const result = await pool.query(
      "INSERT INTO users (userName, name, senha) VALUES ($1, $2, $3) RETURNING id",
      [userName, name, senha]
    );

    res
      .status(201)
      .json({ message: "Usuário criado com sucesso", id: result.rows[0].id });
  } catch (error) {
    res.status(409).json({ message: "Erro ao criar usuário" });
  }
});

// Fazer login
app.post("/login", async (req, res) => {
  const { userName, senha } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE userName = $1", [
      userName,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Usuário não encontrado" });
    }

    const user = result.rows[0];

    if (user.senha !== senha) {
      return res.status(401).json({ message: "Senha inválida" });
    }

    res.status(200).json({
      message: "Login bem-sucedido",
      user: { id: user.id, userName: user.userName },
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao fazer login" });
  }
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
