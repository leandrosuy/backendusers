require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());
const User = require("./models/User");

app.get("/", (req, res) => {
  res.status(200).json({ msg: "Bem vindo a nossa API!" });
});

app.get("/user/:id", async (req, res) => {
  const id = req.params.id;

  const user = await User.findById(id, "-password");

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  res.status(200).json({ user });
});

app.post("/auth/register", async (req, res) => {
  const { userName, email, password } = req.body;

  if (!userName) {
    return res.status(422).json({ msg: "O nome é obrigatrio" });
  }
  if (!email) {
    return res.status(422).json({ msg: "O Email é obrigatrio" });
  }
  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatrio" });
  }

  const userExists = await User.findOne({ email: email });

  if (userExists) {
    return res.status(422).json({ msg: "Por favor, utilize outro e-mail" });
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = new User({
    userName,
    email,
    password: passwordHash,
  });

  try {
    await user.save();

    res.status(201).json({ msg: "Usuário criado com sucesso!" });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Aconteceu um erro no servidor, tente mais tarde!" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(422).json({ msg: "O Email é obrigatrio" });
  }
  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatrio" });
  }

  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  const checkPassword = await bcrypt.compare(password, user.password);
  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha inválida!" });
  }

  try {
    const secret = process.env.JWT_KEY;

    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );
    res.status(200).json({ msg: "Autenticação realizada com sucesso!", token });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ msg: "Aconteceu um erro no servidor, tente mais tarde!" });
  }
});

app.patch("/user/:id", async (req, res) => {
  const id = req.params.id;
  const { password } = req.body;

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = {
    password: passwordHash,
  };

  try {
    const updateUser = await User.updateOne({ emai: id }, user);
    res.status(200).json({ msg: "Senha alterada com sucesso" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@loginjwt.fcovo.mongodb.net/users?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(process.env.PORT || 3000);
    console.log("Aplicação conectada ao banco de dados!");
  })
  .catch((err) => {
    console.log(err);
  });
