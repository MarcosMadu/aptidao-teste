const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.post("/enviar", async (req, res) => {
  const { nome, bem, alcool, sono, trabalhar } = req.body;
  const data = new Date().toLocaleString("pt-BR");

  const html = await ejs.renderFile("./template.ejs", { nome, bem, alcool, sono, trabalhar, data });

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: `"Checklist Aptidão" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_DESTINO,
      subject: "Checklist de Aptidão Diária",
      text: `Checklist preenchido por ${nome}`,
      attachments: [{ filename: "checklist.pdf", content: pdfBuffer }]
    });

    res.send("Checklist enviado com sucesso!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao enviar o e-mail.");
  }
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
