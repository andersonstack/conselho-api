import express from "express";
import cors from "cors";
import pool from "./database.js"; // Importando a conexão com PostgreSQL

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Criar um novo usuário
app.post("/users", async (req, res) => {
  try {
    const { userName, name, senha } = req.body;

    // Verificar se o usuário já existe
    const checkUser = await pool.query(
      "SELECT * FROM users WHERE userName = $1",
      [userName]
    );
    if (checkUser.rows.length > 0) {
      return res.status(409).json({ message: "Usuário já existe" });
    }

    // Criar o usuário
    const result = await pool.query(
      "INSERT INTO users (userName, name, senha) VALUES ($1, $2, $3) RETURNING id",
      [userName, name, senha]
    );

    res
      .status(201)
      .json({ message: "Usuário criado com sucesso", id: result.rows[0].id });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ message: "Erro ao criar usuário" });
  }
});

// Fazer login
app.post("/login", async (req, res) => {
  try {
    const { userName, senha } = req.body;

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
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ message: "Erro ao fazer login" });
  }
});

// Adicionar frase
app.post("/users/:id/frases", async (req, res) => {
  try {
    const { id } = req.params;
    const { fraseKey, fraseValue } = req.body;

    await pool.query(
      "INSERT INTO frases (userId, fraseKey, fraseValue) VALUES ($1, $2, $3)",
      [id, fraseKey, fraseValue]
    );

    res.status(201).json({ message: "Frase adicionada com sucesso" });
  } catch (error) {
    console.error("Erro ao adicionar frase:", error);
    res.status(500).json({ message: "Erro ao adicionar frase" });
  }
});

// Buscar frases do usuário
app.get("/users/:id/frases", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT fraseKey, fraseValue FROM frases WHERE userId = $1",
      [id]
    );

    res.status(200).json({ message: "Frases encontradas", data: result.rows });
  } catch (error) {
    console.error("Erro ao buscar frases:", error);
    res.status(500).json({ message: "Erro ao buscar frases" });
  }
});

// Remover uma frase
app.delete("/users/:id/frases/:fraseKey", async (req, res) => {
  try {
    const { id, fraseKey } = req.params;

    const result = await pool.query(
      "DELETE FROM frases WHERE userId = $1 AND fraseKey = $2 RETURNING *",
      [id, fraseKey]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Frase não encontrada" });
    }

    res.status(200).json({ message: "Frase removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover frase:", error);
    res.status(500).json({ message: "Erro ao remover frase" });
  }
});

// Listar todos os usuários
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, userName, name FROM users");

    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ message: "Erro ao buscar usuários" });
  }
});

// Deletar todos os usuários
app.delete("/users", async (req, res) => {
  try {
    await pool.query("DELETE FROM users");

    res.status(200).json({ message: "Usuários deletados com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar usuários:", error);
    res.status(500).json({ message: "Erro ao deletar usuários" });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
