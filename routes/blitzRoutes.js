const express = require("express");
const router = express.Router();
const axios = require('axios');

const { userHasRole } = require('../src/config/bot'); // Importa a função do bot
const db = require("../src/config/database"); // Importa o db configurado
const ensureAuthenticated = require('../middlewares/authMiddleware');

const moment = require("moment");
require("moment/locale/pt-br");

router.get("/", ensureAuthenticated, async function (req, res) {
  
const GUILD_ID = process.env.GUILD_ID; // ID do servidor
  const ROLE_ID2 = process.env.ROLE_ID2;
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

    const [results] = await db.promise().query("SELECT * FROM blitz");

    // await dao.gravar("Blitz Visualizadas", "Cb. Logan Andrade", "119191919199", ip)
    logDiscord("Blitz Visualizadas", "", req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    res.render("blitz/blitz", { blitz: results,  user: req.session.user,  perm: req.session.perm,});
  } catch (err) {
    console.error("Erro ao consultar blitzs:", err);
    res.status(500).send("Erro ao carregar blitzs");
  }
});

router.get("/criar", ensureAuthenticated, function (req, res) {
  logDiscord("Blitz Criação", "", req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
  res.render("blitz/criarBlitz", { user: req.session.user,  perm: req.session.perm,});
});

router.post("/criar", ensureAuthenticated, async (req, res) => {
  const local = req.body.inLocal;
  const corregedor_responsavel = req.body.inCorrResp;
  const corregedores_presentes = req.body.inCorrPres;
  const oficiais_fiscalizados = req.body.inQuantidade;
  const realizada_em = req.body.inData;
  const status = req.body.inStatus;
  const descricao = req.body.inDesc;

  const autor_atualizacao = req.session.user.nomepm || req.session.user.username
  const data_atualizacao = moment().format("YYYY-MM-DD HH:mm:ss");
  const inLink = req.body.inLink || null;

  let blitzId;
  try {
    if (inLink == null) {
      const blitzQuery = `
    INSERT INTO blitz (local, corregedor_responsavel, corregedores_presentes, oficiais_fiscalizados, realizada_em, status, descricao, data_atualizacao, autor_atualizacao) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      const [result] = await db
        .promise()
        .query(blitzQuery, [
          local,
          corregedor_responsavel,
          corregedores_presentes,
          oficiais_fiscalizados,
          realizada_em,
          status,
          descricao,
          data_atualizacao,
          autor_atualizacao
        ]);

      blitzId = result.insertId;
    } else {
      const [nome_link, url] = inLink.split("<<!separacao!>>");

      const blitzQuery = `
    INSERT INTO blitz (local, corregedor_responsavel, corregedores_presentes, oficiais_fiscalizados, realizada_em, status, descricao, data_atualizacao, autor_atualizacao) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      const blitzLinkQuery = `
      INSERT INTO blitz_links (blitz_id, nome_link, url) 
      VALUES (?, ?, ?)
      `;

      const [result] = await db
        .promise()
        .query(blitzQuery, [
          local,
          corregedor_responsavel,
          corregedores_presentes,
          oficiais_fiscalizados,
          realizada_em,
          status,
          descricao,
          data_atualizacao,
          autor_atualizacao
        ]);

      blitzId = result.insertId;

      const linksArray = inLink.split(","); // Supondo que os links estejam separados por vírgula
      for (const link of linksArray) {
        const [nome_link, url] = link.split("<<!separacao!>>"); // Dividindo o nome e a URL

        // Inserindo cada link na tabela `inquerito_links`
        await db.promise().query(blitzLinkQuery, [blitzId, nome_link, url]);
      }
    } // Fim Else

    //   await dao.gravar("Blitz Criado", "Cb. Logan Andrade", "119191919199", "192.168.127.1")
    logDiscord("Blitz Criada", blitzId, req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    setTimeout(function () {
      res.redirect(`/blitz/visualizar/id=${blitzId}`);
    }, 2000);
    
  } catch (error) {
    console.log(error);
  }
});

router.post("/salvar", ensureAuthenticated, async (req, res) => {
  const {
    blitzId: blitzId,
    inLocal: local,
    inCorrResp: corregedor_responsavel,
    inCorrPres: corregedores_presentes,
    inQuantidade: oficiais_fiscalizados,
    inData: realizada_em,
    inStatus: status,
    inLink,
  } = req.body;
  const descricao = req.body.inDesc || null;

  const autor_atualizacao = req.session.user.nomepm || req.session.user.username
  const data_atualizacao = moment().format("YYYY-MM-DD HH:mm:ss");

  const linkArray = inLink ? inLink.split(",") : [];

  try {
    // Atualizando o inquérito existente
    const updateBlitzQuery = `
                UPDATE blitz 
                SET local = ?, corregedor_responsavel = ?, corregedores_presentes = ?, oficiais_fiscalizados = ?, realizada_em = ?, status = ?, descricao = ?, data_atualizacao = ?, autor_atualizacao = ?
                WHERE id = ?
            `;

    await db
      .promise()
      .query(updateBlitzQuery, [
        local,
        corregedor_responsavel,
        corregedores_presentes,
        oficiais_fiscalizados,
        realizada_em,
        status,
        descricao,
        data_atualizacao,
        autor_atualizacao,
        blitzId,
      ]);

    if (linkArray.length > 0) {
      const deleteLinksQuery = `DELETE FROM blitz_links WHERE blitz_id = ?`;
      await db.promise().query(deleteLinksQuery, [blitzId]);

      const blitzlinkQuery = `
                    INSERT INTO blitz_links (blitz_id, nome_link, url) 
                    VALUES (?, ?, ?)
                `;

      for (const link of linkArray) {
        const [nome_link, url] = link.split("<<!separacao!>>");
        await db.promise().query(blitzlinkQuery, [blitzId, nome_link, url]);
      }
    }

    //   await dao.gravar("Blitz Salvo", "Cb. Logan Andrade", "119191919199", "192.168.127.1");
    logDiscord("Blitz Salva", blitzId, req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    setTimeout(function () {
      res.redirect(`/blitz/visualizar/id=${blitzId}`);
    }, 2000);
  } catch (error) {
    console.log(error);
    res.status(500).send("Erro ao salvar o blitz");
  }
});

router.get("/visualizar/id=:id", ensureAuthenticated, async (req, res) => {
  const blitzId = req.params.id;

  try {
    // Consulta para buscar o inquérito
    const [blitzResults] = await db
      .promise()
      .query("SELECT * FROM blitz WHERE id = ?", [blitzId]);

    // Consulta para buscar os links associados ao inquérito
    const [linkResults] = await db
      .promise()
      .query("SELECT * FROM blitz_links WHERE blitz_id = ?", [blitzId]);

    //  await dao.gravar("Blitz Visualizada", "Cb. Logan Andrade", "119191919199", "192.168.127.1")
    logDiscord("Blitz Visualizada", blitzId, req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    if (blitzResults.length > 0) {
      // Renderizar a página com o inquérito e seus links
      res.render("blitz/verBlitz", {
        blitz: blitzResults[0],
        links: linkResults, 
        perm: req.session.perm,
        user: req.session.user // Passar os links para o EJS
      });
    } else {
      res.status(404).send("Blitz não encontrado");
    }
  } catch (err) {
    console.error("Erro ao consultar Blitz:", err);
    res.status(500).send("Erro ao carregar Blitz");
  }
});

router.get("/deletar/id=:posicao", ensureAuthenticated, async function (req, res) {
  const pos = parseInt(req.params.posicao);
  try {
    await db
      .promise()
      .query("DELETE FROM blitz_links WHERE blitz_id = ?", [pos]);
    await db.promise().query("DELETE FROM blitz WHERE id = ?", [pos]);

    //   await dao.gravar("Oficial Deletado", "Cb. Logan Andrade", "119191919199", "192.168.127.1")
    logDiscord("Blitz Deletada", pos, req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    setTimeout(function () {
      res.redirect("/blitz");
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
  const webhookUrl = process.env.blitzWebhook;
 
  if (userData && webhookUrl) {
    
  await db.promise().query("INSERT INTO logs (acao, discord_author, discord_id, ip) VALUES (?, ?, ?, ?)", [`${acao} ${idAcao}`, userData.username, userData.id, ipAddress]);
    const webhookPayload = {
      embeds: [
        {
          color: 0, 
          title: `Blitz N°${idAcao}`,
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
            text: 'Sistema de Logs (Blitz) - Corregedoria Painel',
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
     case "Blitz Visualizadas":
       return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
     case "Blitz Visualizada":
       return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
     case "Blitz Criação":
       return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
     case "Blitz Criada":
       return `https://img.icons8.com/fluent-systems-regular/512/FFFFFF/plus.png`;
     case "Blitz Deletada":
       return `https://img.icons8.com/win8/512/FFFFFF/trash.png`;
     case "Blitz Salva":
       return `https://img.icons8.com/ios11/512/FFFFFF/refresh.png`;
     default:
       return `https://cdn-icons-png.freepik.com/256/807/807317.png?semt=ais_hybrid`; 
   }
   }

module.exports = router;
