const express = require("express");
const router = express.Router();
const axios = require('axios');

const db = require("../src/config/database"); // Importa o db configurado


const ensureAuthenticated = require('../middlewares/authMiddleware');


const { userHasRole } = require('../src/config/bot'); // Importa a função do bot
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

    const [results] = await db
      .promise()
      .query("SELECT * FROM oficiais ORDER BY id ASC");

    // await dao.gravar("Oficiais Visualizados", "Cb. Logan Andrade", "119191919199", ip)
    logDiscord("Oficiais Visualizados", "", req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    res.render("oficial/oficiais", { oficiais: results,   perm: req.session.perm, user: req.session.user });
  } catch (err) {
    console.error("Erro ao consultar inquéritos:", err);
    res.status(500).send("Erro ao carregar inquéritos");
  }
});

router.get("/criar", ensureAuthenticated, function (req, res) {
  logDiscord("Oficial Criação", "", req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
  res.render("oficial/criarOficial", {  perm: req.session.perm, user: req.session.user,});
});

router.post("/criar", ensureAuthenticated, async (req, res) => {
  const id = req.body.inId;
  const id_discord = req.body.inIdDiscord;
  const rg = req.body.inRg;
  const nome = req.body.inNome;
  const patente = req.body.inPatente;
  const unidade = req.body.inUnidade;
  const data = req.body.inData || undefined;
  const descricao = req.body.inDesc;
  const status = req.body.inStatus;

  
  const autor_atualizacao = req.session.user.nomepm || req.session.user.username
  const data_atualizacao = moment().format("YYYY-MM-DD HH:mm:ss");
  const inLink = req.body.inLink || null;

  let oficialId;
  try {
    if (inLink == null) {
      const inqueritoQuery = `
    INSERT INTO oficiais (id_ingame, id_discord, nome, rg, patente, unidade, data_registro, data_atualizacao, autor_atualizacao, status, observacoes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      const [result] = await db
        .promise()
        .query(inqueritoQuery, [
          id,
          id_discord,
          nome,
          rg,
          patente,
          unidade,
          data,
          data_atualizacao,
          autor_atualizacao,
          status,
          descricao,
        ]);

      oficialId = result.insertId;
    } else {
      const [nome_link, url] = inLink.split("<<!separacao!>>");

      const inqueritoQuery = `
      INSERT INTO oficiais (id_ingame, id_discord, nome, rg, patente, unidade, data_registro, data_atualizacao, autor_atualizacao, status, observacoes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const inqueritolinkQuery = `
      INSERT INTO oficial_links (oficial_id, id_registro, nome_link, url) 
      VALUES (?, ?, ?, ?)
      `;

      const [result] = await db
        .promise()
        .query(inqueritoQuery, [
          id,
          id_discord,
          nome,
          rg,
          patente,
          unidade,
          data,
          data_atualizacao,
          autor_atualizacao,
          status,
          descricao,
        ]);
      oficialId = result.insertId;

      const linksArray = inLink.split(","); // Supondo que os links estejam separados por vírgula
      for (const link of linksArray) {
        const [nome_link, url] = link.split("<<!separacao!>>"); // Dividindo o nome e a URL

        // Inserindo cada link na tabela `inquerito_links`
        await db
          .promise()
          .query(inqueritolinkQuery, [id, oficialId, nome_link, url]);
      }
    } // Fim Else

    //  await dao.gravar("Oficial Criado", "Cb. Logan Andrade", "119191919199", "192.168.127.1")
    logDiscord("Oficial Criado", id + ` - (${nome})`, req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    setTimeout(function () {
      res.redirect(`/oficiais/visualizar/id=${id}`);
    }, 2000);
  } catch (error) {
    console.log(error);
  }
});

router.post("/salvar", ensureAuthenticated, async (req, res) => {
  const {
    inId_ingame: id_ingame,
    inRg: rg,
    inNome: nome,
    inPatente: patente,
    inUnidade: unidade,
    inData: data,
    inStatus: status,
    inDesc: descricao,
    inLink,
  } = req.body;

  
  const autor_atualizacao = req.session.user.nomepm || req.session.user.username
  const data_atualizacao = moment().format("YYYY-MM-DD HH:mm:ss");
  const linkArray = inLink ? inLink.split(",") : [];

  try {
    // Recuperando o id do oficial com base no id_ingame
    const [rows] = await db
      .promise()
      .query(`SELECT id FROM oficiais WHERE id_ingame = ?`, [id_ingame]);

    if (rows.length === 0) {
      return res.status(404).send("Oficial não encontrado");
    }

    const id_registro = rows[0].id;

    // Atualizando o oficial existente
    const updateOficialQuery = `
                UPDATE oficiais 
                SET nome = ?, rg = ?, patente = ?, unidade = ?, data_registro = ?, data_atualizacao = ?, autor_atualizacao = ?, status = ?, observacoes = ?
                WHERE id = ?
            `;

    await db
      .promise()
      .query(updateOficialQuery, [
        nome,
        rg,
        patente,
        unidade,
        data,
        data_atualizacao,
        autor_atualizacao,
        status,
        descricao,
        id_registro,
      ]);

    if (linkArray.length > 0) {
      // Removendo links anteriores
      const deleteLinksQuery = `DELETE FROM oficial_links WHERE oficial_id = ?`;
      await db.promise().query(deleteLinksQuery, [id_ingame]);

      // Inserindo novos links
      const oficiallinkQuery = `
                    INSERT INTO oficial_links (oficial_id, id_registro, nome_link, url) 
                    VALUES (?, ?, ?, ?)
                `;

      for (const link of linkArray) {
        const [nome_link, url] = link.split("<<!separacao!>>");
        await db
          .promise()
          .query(oficiallinkQuery, [id_ingame, id_registro, nome_link, url]);
      }
    }

    //  await dao.gravar("Inquérito Salvo", "Cb. Logan Andrade", "119191919199", "192.168.127.1");
    logDiscord("Oficial Salvo", id_ingame + ` - (${nome})`, req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    setTimeout(function () {
      res.redirect(`/oficiais/visualizar/id=${id_ingame}`);
    }, 2000);
            
  } catch (error) {
    console.log(error);
    res.status(500).send("Erro ao salvar o inquérito");
  }
});

router.get("/visualizar/id=:id", ensureAuthenticated, async (req, res) => {
  const oficialId = req.params.id;

  try {
    // Consulta para buscar o inquérito
    const [oficiaisResults] = await db
      .promise()
      .query("SELECT * FROM oficiais WHERE id_ingame = ?", [oficialId]);

    // Consulta para buscar os links associados ao inquérito
    const [linkResults] = await db
      .promise()
      .query("SELECT * FROM oficial_links WHERE oficial_id = ?", [oficialId]);

    //    await dao.gravar("Inquérito Visualizado", "Cb. Logan Andrade", "119191919199", "192.168.127.1")
    logDiscord("Oficial Visualizado", oficialId + ` - (${oficiaisResults[0].nome})`, req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    if (oficiaisResults.length > 0) {
      // Renderizar a página com o inquérito e seus links
      res.render("oficial/verOficial", {
        oficial: oficiaisResults[0],
        links: linkResults,
        perm: req.session.perm,
        user: req.session.user // Passar os links para o EJS
      });
    } else {
      res.status(404).send("Inquérito não encontrado");
    }
  } catch (err) {
    console.error("Erro ao consultar inquérito:", err);
    res.status(500).send("Erro ao carregar inquérito");
  }
});

router.get("/deletar/id=:posicao", ensureAuthenticated, async function (req, res) {
  const pos = parseInt(req.params.posicao);
  try {
    await db
      .promise()
      .query("DELETE FROM oficial_links WHERE oficial_id = ?", [pos]);
    await db.promise().query("DELETE FROM oficiais WHERE id_ingame = ?", [pos]);

    //   await dao.gravar("Oficial Deletado", "Cb. Logan Andrade", "119191919199", "192.168.127.1")
    logDiscord("Oficial Deletado", pos, req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    setTimeout(function () {
      res.redirect("/oficiais");
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
  const webhookUrl = process.env.oficiaisWebhook;
 
  if (userData && webhookUrl) {
    
  await db.promise().query("INSERT INTO logs (acao, discord_author, discord_id, ip) VALUES (?, ?, ?, ?)", [`${acao} ${idAcao}`, userData.username, userData.id, ipAddress]);
    const webhookPayload = {
      embeds: [
        {
          color: 0, 
          title: `Oficial N°${idAcao}`,
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
            text: 'Sistema de Logs (Oficiais) - Corregedoria Painel',
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
     case "Oficiais Visualizados":
       return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
     case "Oficial Visualizado":
       return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
     case "Oficial Criação":
       return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
     case "Oficial Criado":
       return `https://img.icons8.com/fluent-systems-regular/512/FFFFFF/plus.png`;
     case "Oficial Deletado":
       return `https://img.icons8.com/win8/512/FFFFFF/trash.png`;
     case "Oficial Salvo":
       return `https://img.icons8.com/ios11/512/FFFFFF/refresh.png`;
     default:
       return `https://cdn-icons-png.freepik.com/256/807/807317.png?semt=ais_hybrid`; 
   }
   }
module.exports = router;
