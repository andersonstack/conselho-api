import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import bcrypt from "bcrypt";
const port = process.env.PORT || 3000;

const prisma = new PrismaClient();
prisma
  .$connect()
  .then(() => {
    console.log("Conectado ao banco de dados com sucesso!");
  })
  .catch((err) => {
    console.error("Erro ao conectar com o banco de dados:", err.message);
  });
const app = express();

// Configurações da conexão
app.use(express.json());
app.use(cors());

// Rota para criar novo usuário
app.post("/users", async (req, res) => {
  try {
    // Verificando se o nome de usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: {
        userName: req.body.userName,
      },
    });

    if (existingUser) {
      // Se o usuário já existir, retorna erro 504
      return res.status(504).send({
        message: "Usuário já existe",
      });
    }

    // Criptografando a senha antes de salvar no banco de dados
    const hashedPassword = await bcrypt.hash(req.body.senha, 10);

    // Salvando os dados no banco
    const user = await prisma.user.create({
      data: {
        userName: req.body.userName,
        name: req.body.name,
        senha: hashedPassword,
        frases: req.body.frases,
      },
    });

    res.status(201).send({
      message: "Usuário criado com sucesso",
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Erro ao criar usuário",
      error: error.message,
    });
  }
});

// Rota para fazer login
app.post("/login", async (req, res) => {
  try {
    const { userName, senha } = req.body;

    // Verificando se o usuário existe
    const user = await prisma.user.findUnique({
      where: { userName },
    });

    if (!user) {
      return res.status(400).send({
        message: "Usuário não encontrado",
      });
    }

    // Comparando a senha fornecida com a senha criptografada no banco
    const isPasswordValid = await bcrypt.compare(senha, user.senha);

    if (!isPasswordValid) {
      return res.status(401).send({
        message: "Senha inválida",
      });
    }

    res.setHeader("Content-type", "application/json");
    res.status(200).send({
      message: "Login bem-sucedido",
      data: { id: user.id, userName: user.userName, senha: user.name },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Erro ao realizar login",
      error: error.message,
    });
  }
});

// Rota para adicionar uma frase
app.put("/users/:id/frases", async (req, res) => {
  try {
    const { id } = req.params;
    const { fraseKey, fraseValue } = req.body;

    // Encontrar usuário pelo ID
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Verifica se o campo "frases" já tem a chave
    const frases = user.frases || {}; // Garante que frases não seja undefined
    if (frases[fraseKey]) {
      return res.status(409).json({ message: "Frase já existente" });
    }

    // Atualiza apenas a chave necessária no JSON
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        frases: { ...frases, [fraseKey]: fraseValue },
      },
    });

    res.status(200).json({
      message: "Frase adicionada com sucesso",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erro ao editar a frase",
      error: error.message,
    });
  }
});

// Rota para remover uma frase
app.delete("/users/:id/frases/:fraseKey", async (req, res) => {
  try {
    const { id, fraseKey } = req.params;

    // Encontrando o usuário pelo ID
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).send({
        message: "Usuário não encontrado",
      });
    }

    // Verificando se a chave da frase existe
    if (!user.frases[fraseKey]) {
      return res.status(404).send({
        message: "Frase não encontrada",
      });
    }

    // Removendo a chave do objeto "frases"
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        frases: {
          ...user.frases, // Mantém as frases existentes
          [fraseKey]: undefined, // Remove a frase específica
        },
      },
    });

    res.status(200).send({
      message: "Frase removida com sucesso",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Erro ao remover a frase",
      error: error.message,
    });
  }
});

app.get("/users/:id/frases", async (req, res) => {
  const userId = req.params.id; // Captura o ID do usuário da URL

  try {
    // Buscando o usuário com suas frases associadas
    const userWithFrases = await prisma.user.findUnique({
      where: { id: userId }, // ID do usuário fornecido na URL
    });

    if (!userWithFrases) {
      return res.status(404).send({
        message: "Usuário não encontrado",
      });
    }

    res.status(200).send({
      message: "Usuário e suas frases encontrados",
      data: userWithFrases.frases, // Retorna apenas as frases
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Erro ao buscar as frases do usuário",
      error: error.message,
    });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).send({
      message: "Usuários encontrados",
      data: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Erro ao buscar usuários",
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log("Servidor rodando na porta", port);
});
