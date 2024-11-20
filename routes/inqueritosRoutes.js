const express = require("express");
const router = express.Router();
const axios = require('axios');

const moment = require("moment");
require("moment/locale/pt-br");

const { userHasRole } = require('../src/config/bot'); // Importa a função do bot
const db = require("../src/config/database"); // Importa o db configurado


const ensureAuthenticated = require('../middlewares/authMiddleware');


router.get("/", ensureAuthenticated, async function (req, res) {
  
const GUILD_ID = process.env.GUILD_ID; // ID do servidor
  const ROLE_ID2 = process.env.ROLE_ID2
  const userId = req.session.user.id
  const hasRole2 = await userHasRole(GUILD_ID, userId, ROLE_ID2);

  // Salvar os dados do usuário na sessão
  req.session.perm = hasRole2

  const [nomepm] = await db.promise().query("SELECT nome FROM oficiais WHERE id_discord = ?", [req.session.user.id]);
  const [patentepm] = await db.promise().query("SELECT patente FROM oficiais WHERE id_discord = ?", [req.session.user.id]);
 if (nomepm == "") {
  req.session.user.nomepm = null
  req.session.user.patentepm = null
 } else {
  req.session.user.nomepm = nomepm[0].nome
  req.session.user.patentepm = patentepm[0].patente
 }
  
  try {
    const ip = req.ip;

    const [results] = await db.promise().query("SELECT * FROM inqueritos");

    logDiscord("Inquéritos Visualizados", "", req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    res.render("inquerito/inqueritos", { inqueritos: results,  user: req.session.user,  perm: req.session.perm,});
  } catch (err) {
    console.error("Erro ao consultar inquéritos:", err);
    res.status(500).send("Erro ao carregar inquéritos");
  }
});

router.get("/visualizar/id=:id", ensureAuthenticated, async (req, res) => {
  const inqueritoId = req.params.id;

  try {
    const [inqueritoResults] = await db
      .promise()
      .query("SELECT * FROM inqueritos WHERE id = ?", [inqueritoId]);

    const [linkResults] = await db
      .promise()
      .query("SELECT * FROM inquerito_links WHERE inquerito_id = ?", [
        inqueritoId,
      ]);

    //  await dao.gravar("Inquérito Visualizado", "Cb. Logan Andrade", "119191919199", "192.168.127.1")
    logDiscord("Inquérito Visualizado", inqueritoId, req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    if (inqueritoResults.length > 0) {
      // Renderizar a página com o inquérito e seus links
      res.render("inquerito/verInquerito", {
        inquerito: inqueritoResults[0],
        links: linkResults,
        user: req.session.user,
        perm: req.session.perm, // Passar os links para o EJS
      });
    } else {
      res.status(404).send("Inquérito não encontrado");
    }
  } catch (err) {
    console.error("Erro ao consultar inquérito:", err);
    res.status(500).send("Erro ao carregar inquérito");
  }
});

router.get("/criar", ensureAuthenticated, function (req, res) {
  logDiscord("Inquérito Criação", "", req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
  res.render("inquerito/criarInquerito", { user: req.session.user,  perm: req.session.perm,});
});

router.post("/criar", ensureAuthenticated, async (req, res) => {
  const titulo = req.body.inTitulo;
  const tipo = req.body.inTipo;
  const requerente = req.body.inRequerente;
  const delator = req.body.inDelator;
  const reu = req.body.inReu;
  const data = req.body.inData;
  const envolvidos = req.body.inEnvolvidos;
  const descricao = req.body.inDesc;
  const status = req.body.inStatus;

  
  const autor_atualizacao = req.session.user.nomepm || req.session.user.username
  const data_atualizacao = moment().format("YYYY-MM-DD HH:mm:ss");
  const inLink = req.body.inLink || null;

  let inqueritoId;
  try {
    if (inLink == null) {
      const inqueritoQuery = `
    INSERT INTO inqueritos (titulo, tipo, delator, reu, requerente, data_ocorrencia, data_atualizacao, autor_atualizacao, status, envolvidos_secundarios, descricao) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      const [result] = await db
        .promise()
        .query(inqueritoQuery, [
          titulo,
          tipo,
          delator,
          reu,
          requerente,
          data,
          data_atualizacao,
          autor_atualizacao,
          status,
          envolvidos,
          descricao,
        ]);

      inqueritoId = result.insertId;
    } else {
      const [nome_link, url] = inLink.split("<<!separacao!>>");

      const inqueritoQuery = `
      INSERT INTO inqueritos (titulo, tipo, delator, reu, requerente, data_ocorrencia, data_atualizacao, autor_atualizacao, status, envolvidos_secundarios, descricao) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const inqueritolinkQuery = `
      INSERT INTO inquerito_links (inquerito_id, nome_link, url) 
      VALUES (?, ?, ?)
      `;

      const [result] = await db
        .promise()
        .query(inqueritoQuery, [
          titulo,
          tipo,
          delator,
          reu,
          requerente,
          data,
          data_atualizacao,
          autor_atualizacao,
          status,
          envolvidos,
          descricao,
        ]);
      inqueritoId = result.insertId;

      const linksArray = inLink.split(","); // Supondo que os links estejam separados por vírgula
      for (const link of linksArray) {
        const [nome_link, url] = link.split("<<!separacao!>>"); // Dividindo o nome e a URL

        // Inserindo cada link na tabela `inquerito_links`
        await db
          .promise()
          .query(inqueritolinkQuery, [inqueritoId, nome_link, url]);
      }
    } // Fim Else

    //  await dao.gravar("Inquérito Criado", "Cb. Logan Andrade", "119191919199", "192.168.127.1")
    logDiscord("Inquérito Criado", inqueritoId, req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    setTimeout(() => {
      res.redirect(`/inqueritos/visualizar/id=${inqueritoId}`); 
    }, "2000");
  } catch (error) {
    console.log(error);
  }
});

router.post("/salvar", ensureAuthenticated, async (req, res) => {
  const {
    inqueritoId,
    inTitulo: titulo,
    inTipo: tipo,
    inRequerente: requerente,
    inDelator: delator,
    inReu: reu,
    inData: data,
    inEnvolvidos: envolvidos,
    inDesc: descricao,
    inStatus: status,
    inLink,
  } = req.body;

  const autor_atualizacao = req.session.user.nomepm || req.session.user.username
  const data_atualizacao = moment().format("YYYY-MM-DD HH:mm:ss");
  const linkArray = inLink ? inLink.split(",") : [];

  try {
    // Atualizando o inquérito existente
    const updateInqueritoQuery = `
                UPDATE inqueritos 
                SET titulo = ?, tipo = ?, delator = ?, reu = ?, requerente = ?, data_ocorrencia = ?, data_atualizacao = ?, autor_atualizacao = ?, status = ?, envolvidos_secundarios = ?, descricao = ?
                WHERE id = ?
            `;

    await db
      .promise()
      .query(updateInqueritoQuery, [
        titulo,
        tipo,
        delator,
        reu,
        requerente,
        data,
        data_atualizacao,
        autor_atualizacao,
        status,
        envolvidos,
        descricao,
        inqueritoId,
      ]);

    if (linkArray.length > 0) {
      const deleteLinksQuery = `DELETE FROM inquerito_links WHERE inquerito_id = ?`;
      await db.promise().query(deleteLinksQuery, [inqueritoId]);

      const inqueritolinkQuery = `
                    INSERT INTO inquerito_links (inquerito_id, nome_link, url) 
                    VALUES (?, ?, ?)
                `;

      for (const link of linkArray) {
        const [nome_link, url] = link.split("<<!separacao!>>");
        await db
          .promise()
          .query(inqueritolinkQuery, [inqueritoId, nome_link, url]);
      }
    }

    // await dao.gravar("Inquérito Salvo", "Cb. Logan Andrade", "119191919199", "192.168.127.1");
    logDiscord("Inquérito Salvo", inqueritoId, req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    setTimeout(() => {
      res.redirect(`/inqueritos/visualizar/id=${inqueritoId}`); 
    }, "1000");
  } catch (error) {
    console.log(error);
    res.status(500).send("Erro ao salvar o inquérito");
  }
});

router.get("/deletar/id=:id", ensureAuthenticated, async function (req, res) {
  const pos = parseInt(req.params.id);
  try {
    await db
      .promise()
      .query("DELETE FROM inquerito_links WHERE inquerito_id = ?", [pos]);
    await db.promise().query("DELETE FROM inqueritos WHERE id = ?", [pos]);

    //  await dao.gravar("Inquérito Deletado", "Cb. Logan Andrade", "119191919199", "192.168.127.1")
    logDiscord("Inquérito Deletado", pos, req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    setTimeout(function () {
      res.redirect("/inqueritos");
    }, 2000);
  } catch (error) {
    res.send(`error: ${error} <br> ${pos}`);
  }
});

async function logDiscord(acao, idAcao, user, ipAddress2) {
 // Obter informações do usuário antes de destruir a sessão
 const userData = user;
 const ipAddress = ipAddress2;

 // Configurar payload para o webhook
 const webhookUrl = process.env.inqueritosWebhook;

 if (userData && webhookUrl) {
  
  await db.promise().query("INSERT INTO logs (acao, discord_author, discord_id, ip) VALUES (?, ?, ?, ?)", [`${acao} ${idAcao}`, userData.username, userData.id, ipAddress]);
   const webhookPayload = {
     embeds: [
       {
         color: 0, 
         title: `Inquérito N°${idAcao}`,
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
           { name: 'Email (se disponível)', value: userData.email || 'Não disponível', inline: true },
           { name: 'MFA Ativado', value: userData.mfa_enabled ? 'Sim' : 'Não', inline: true },
           { name: 'Admin Permissão', value: userData.perm ? 'Sim' : 'Não', inline: true },
           { name: 'IP Address', value: ipAddress, inline: true },
         ],
         footer: {
           text: 'Sistema de Logs (Inqueritos) - Corregedoria Painel',
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
    case "Inquéritos Visualizados":
      return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
    case "Inquérito Visualizado":
      return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
    case "Inquérito Criação":
      return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
    case "Inquérito Criado":
      return `https://img.icons8.com/fluent-systems-regular/512/FFFFFF/plus.png`;
    case "Inquérito Deletado":
      return `https://img.icons8.com/win8/512/FFFFFF/trash.png`;
    case "Inquérito Salvo":
      return `https://img.icons8.com/ios11/512/FFFFFF/refresh.png`;
    default:
      return `https://cdn-icons-png.freepik.com/256/807/807317.png?semt=ais_hybrid`; 
  }
  }
module.exports = router;
