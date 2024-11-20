const express = require("express");
const router = express.Router();
const db = require("../src/config/database"); // Importa o db configurado
const axios = require('axios');

const moment = require("moment");
require("moment/locale/pt-br");


const ensureAuthenticated = require('../middlewares/authMiddleware');

const { userHasRole } = require('../src/config/bot'); // Importa a função do bot

router.get("/", ensureAuthenticated, async function (req, res) {
  
  
  // Salvar os dados do usuário na sessão
  
  const GUILD_ID = process.env.GUILD_ID; // ID do servidor
  const ROLE_ID2 = process.env.ROLE_ID2;
  const userId = req.session.user.id
  const hasRole2 = await userHasRole(GUILD_ID, userId, ROLE_ID2);
  req.session.perm = hasRole2

 // res.render('home/home', { user: req.session.user });
 const result = await db
    .promise()
    .query("SELECT COUNT(*) AS total FROM inqueritos");
  const result2 = await db
    .promise()
    .query("SELECT COUNT(*) AS total FROM oficiais");
  const result3 = await db
    .promise()
    .query("SELECT COUNT(*) AS total FROM blitz");
  var [avisos] = await db
    .promise()
    .query("SELECT * FROM avisos ORDER BY id DESC LIMIT 1;");

  // Acessa o valor de `total`
  const quantidade = result[0][0].total;
  const quantidadeOfc = result2[0][0].total;
  const quantidadeBlitz = result3[0][0].total;

  const dataFormatada = moment()
    .locale("pt-br")
    .format("dddd, D [de] MMMM [de] YYYY")
    .toUpperCase();

  const semaviso = {
    aviso: "Sem avisos!",
    autor: "Ninguem",
    data_aviso: "-",
  };

  const [nomepm] = await db.promise().query("SELECT nome FROM oficiais WHERE id_discord = ?", [req.session.user.id]);
  const [patentepm] = await db.promise().query("SELECT patente FROM oficiais WHERE id_discord = ?", [req.session.user.id]);
 if (nomepm == "") {
  req.session.user.nomepm = null
  req.session.user.patentepm = null
 } else {
  req.session.user.nomepm = nomepm[0].nome
  req.session.user.patentepm = patentepm[0].patente
 }
  const perm = req.session.perm

  logDiscord("Home Visualizado", "", req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
  res.render("home/home", {
    user: req.session.user,
    quantidadeInqueritos: quantidade,
    quantidadeBlitz: quantidadeBlitz, 
    perm: req.session.perm,
    quantidadeOficiais: quantidadeOfc,
    dataFormatada: dataFormatada,
    aviso: avisos.length == 0 ? semaviso : avisos[0],
  });


});

async function logDiscord(acao, idAcao, user, ipAddress2) {
  // Obter informações do usuário antes de destruir a sessão
  const userData = user;
  const ipAddress = ipAddress2;
 
  // Configurar payload para o webhook
  const webhookUrl = process.env.miscWebhook
 
  if (userData && webhookUrl) {
    
  await db.promise().query("INSERT INTO logs (acao, discord_author, discord_id, ip) VALUES (?, ?, ?, ?)", [`${acao} ${idAcao}`, userData.username, userData.id, ipAddress]);
    const webhookPayload = {
      embeds: [
        {
          color: 0, 
          title: `${idAcao}`,
          author: {
            name: `${acao}`,
            icon_url: `${verIcone(acao)}`
          },
          thumbnail: {
            url: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
          },
          fields: [
            { name: 'Username', value: `${userData.username} ${ userData.nomepm == null ? "" : `(${userData.nomepm})` }`, inline: true },
            { name: 'User ID', value: userData.id, inline: true },
            { name: 'Email', value: userData.email || 'Não disponível', inline: true },
            { name: 'MFA Ativado', value: userData.mfa_enabled ? 'Sim' : 'Não', inline: true },
            { name: 'Admin Permissão', value: userData.perm ? 'Sim' : 'Não', inline: true },
            { name: 'IP Address', value: ipAddress, inline: true },
          ],
          footer: {
            text: 'Sistema de Logs (Misc) - Corregedoria Painel',
            icon_url: 'https://media.discordapp.net/attachments/1222972528985772192/1291807066477957183/corr_icon.png?ex=673ebe55&is=673d6cd5&hm=68f8fe8e97fe65b500596900984a3593aaebd4e10608c82636b1b049d8c92846&=&format=webp&quality=lossless&width=662&height=662' // Substituir pelo link da imagem desejada
          },
          timestamp: new Date().toISOString()
        }
      ]
    };
 
    // Enviar webhook
    await axios.post(webhookUrl, webhookPayload);
  }
 }
 
 function verIcone(acao) {
   switch (acao) {
     case "Home Visualizado":
       return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
     default:
       return `https://cdn-icons-png.freepik.com/256/807/807317.png?semt=ais_hybrid`; 
   }
   }

module.exports = router;
