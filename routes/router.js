const express = require("express");
const router = express.Router();
const path = require('path');
const mysql = require('mysql2/promise');  // Use mysql2/promise
const axios = require('axios');
const ensureAuthenticated = require('../middlewares/authMiddleware');

const { userHasRole } = require('../src/config/bot'); // Importa a função do bot


require('dotenv').config({ path: './src/config/.env' });
const db = require('../src/config/database'); // Importa o db configurado

const moment = require('moment');
require('moment/locale/pt-br');


const data = new Date();
//const authMiddleware = require('../middlewares/authMiddleware');

// ------------------ Conexão DB --------------------- //
// Configurações do Discord OAuth
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_CALLBACK_URL;

const GUILD_ID = process.env.GUILD_ID; // ID do servidor
const ROLE_ID = process.env.ROLE_ID; // ID do cargo



// Iniciar login com Discord
router.get('/login', (req, res) => {
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
  res.redirect(discordAuthUrl);
});

// Callback do Discord OAuth
router.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) return res.redirect('/');

  try {
    // Obter token de acesso do Discord
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      scope: 'identify'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = tokenResponse.data;

    // Obter dados do usuário do Discord
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userId = userResponse.data.id;

    // Verificar se o usuário tem o cargo necessário no servidor
    const hasRole = await userHasRole(GUILD_ID, userId, ROLE_ID);
    if (!hasRole) {
      logDiscord("Tentativa de Acesso", "", userResponse.data, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    
      return res.status(403).render('misc/error', {user:req.session.user, erro: "Você não tem permissão para acessar esta página!"});
    }
    
    const ROLE_ID2 = process.env.ROLE_ID2;
    const hasRole2 = await userHasRole(GUILD_ID, userId, ROLE_ID2);
 

    // Salvar os dados do usuário na sessão
    req.session.perm = hasRole2

    req.session.user = userResponse.data;

       // Enviar informações para o webhook
       const webhookUrl = process.env.loginWebhook;
       const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
   
       const webhookPayload = {
         embeds: [
           {
             color: 0, 
             author: {
               name: `Login Detectado`,
               icon_url: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0e122YRKp_Ed16EzSCWxXOgMa1yGU8RP_GA&s`
             },
             thumbnail: {
               url: `https://cdn.discordapp.com/avatars/${userId}/${userResponse.data.avatar}.png`
             },
             fields: [
               { name: 'Username', value: `${userResponse.data.username}#${userResponse.data.discriminator}`, inline: true },
               { name: 'User ID', value: userResponse.data.id, inline: true },
               { name: 'Email', value: userResponse.data.email || 'Não disponível', inline: true },
               { name: 'MFA Ativado', value: userResponse.data.mfa_enabled ? 'Sim' : 'Não', inline: true },
               { name: 'Admin Permissão', value: hasRole2 ? 'Sim' : 'Não', inline: true },
               { name: 'IP Address', value: ipAddress, inline: false }
             ],
             footer: {
               text: 'Sistema de Login - Corregedoria Painel',
               icon_url: 'https://media.discordapp.net/attachments/1222972528985772192/1291807066477957183/corr_icon.png?ex=673ebe55&is=673d6cd5&hm=68f8fe8e97fe65b500596900984a3593aaebd4e10608c82636b1b049d8c92846&=&format=webp&quality=lossless&width=662&height=662' // Substituir pelo link da imagem desejada
             },
             timestamp: new Date().toISOString()
           }
         ]
       };
   
       await axios.post(webhookUrl, webhookPayload);
   
    res.redirect('/home');
  } catch (err) {
    console.error('Erro no callback:', err.response?.data || err.message);
    res.redirect('/');
  }
});

// Página home (verificar sessão)



router.get('/logout', ensureAuthenticated, async (req, res) => {
  try {
    // Obter informações do usuário antes de destruir a sessão
    const userData = req.session.user;
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Configurar payload para o webhook
    const webhookUrl = process.env.logoutWebhook;

    if (userData && webhookUrl) {
      const webhookPayload = {
        embeds: [
          {
            title: 'Logout Realizado',
            description: `${userData.username}#${userData.discriminator} acabou de sair.`,
            color: 16777215, // Vermelho
            author: {
              name: `Lougout Detectado`,
              icon_url: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0e122YRKp_Ed16EzSCWxXOgMa1yGU8RP_GA&s`
            },
            thumbnail: {
              url: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
            },
            fields: [
              { name: 'Username', value: userData.username, inline: true },
              { name: 'User ID', value: userData.id, inline: true },
              { name: 'Email (se disponível)', value: userData.email || 'Não disponível', inline: true },
              { name: 'MFA Ativado', value: userData.mfa_enabled ? 'Sim' : 'Não', inline: true },
              { name: 'Admin Permissão', value: req.session.perm ? 'Sim' : 'Não', inline: true },
              { name: 'IP Address', value: ipAddress, inline: true },
            ],
            footer: {
              text: 'Sistema de Logout - Corregedoria Painel',
              icon_url: 'https://media.discordapp.net/attachments/1222972528985772192/1291807066477957183/corr_icon.png?ex=673ebe55&is=673d6cd5&hm=68f8fe8e97fe65b500596900984a3593aaebd4e10608c82636b1b049d8c92846&=&format=webp&quality=lossless&width=662&height=662' // Substituir pelo link da imagem desejada
            },
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Enviar webhook
      await axios.post(webhookUrl, webhookPayload);
    }
  } catch (err) {
    console.error('Erro ao enviar webhook de logout:', err.response?.data || err.message);
  }

  // Destruir a sessão e redirecionar
  req.session.destroy(() => res.redirect('/'));
});


// Roteadores
router.get('/', function (req, res) {
 res.render('index')
});


router.get('/imagens', ensureAuthenticated, async function (req, res) {
  
  try {
  

    // Corrigir a consulta SQL
    const imagensQuery = `
      SELECT inquerito_id,url FROM inquerito_links
    `;
    const imagensQuery2 = `
      SELECT url FROM oficial_links
    `;
    const imagensQuery3 = `
      SELECT url FROM blitz_links
    `;

    const [result] = await db.promise().query(imagensQuery);
    const [result2] = await db.promise().query(imagensQuery2);
    const [result3] = await db.promise().query(imagensQuery3);
   
    
    // Gravar log
    // await dao.gravar("Imagens Sendo Vistas", "Cb. Logan Andrade", "119191919199", req.ip);
     
    // Renderizar a página com os resultados
    logDiscord("Imagens Visualizadas", "", req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    res.render('misc/imagens', { url: result, url2: result2, url3: result3, user: req.session.user,  perm: req.session.perm,});
   
  } catch (error) {
    console.log('Erro ao buscar imagens:', error);
    res.status(500).send('Erro ao carregar imagens');
  } 
});

router.get('/logs', ensureAuthenticated, async function (req, res) {

    const [results] = await db.promise().query('SELECT * FROM logs');
    
    logDiscord("Logs Visualizadas", "", req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    res.render('misc/logs', { logs: results,  user: req.session.user,  perm: req.session.perm,});
});



router.get('/avisos/criar', ensureAuthenticated, (req, res) => {
  logDiscord("Aviso Criação", "", req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
  res.render('home/criarAviso', { user: req.session.user,  perm: req.session.perm, })
}) 
router.post('/avisos/criar', ensureAuthenticated, async (req, res) => {
  const autor = `${req.session.user.username}`
 
  const data_aviso = moment().format('YYYY-MM-DD HH:mm:ss');
  const aviso = req.body.inDesc
  try {
  

    // Corrigir a consulta SQL
    const avisosQuery = `
      INSERT INTO avisos (autor, data_aviso, aviso) VALUES (?,?,?)
    `;
   
    
    const [result] =  await db.promise().query(avisosQuery, [autor, data_aviso, aviso]);
  
   
    const idaviso = result.insertId
    logDiscord("Aviso Criado", `Aviso N°${idaviso}`, req.session.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    // Gravar log
  //  await dao.gravar("Aviso Criado", "Cb. Logan Andrade", "119191919199", req.ip);
     
    // Renderizar a página com os resultados
   
   
    res.redirect('/home')
  } catch (error) {
    console.log('Erro ao postar aviso:', error);
    res.status(500).send('Erro ao postar aviso');
  } 
}) 


async function logDiscord(acao, idAcao, user, ipAddress2) {
  // Obter informações do usuário antes de destruir a sessão
  const userData = user;
  const ipAddress = ipAddress2;
 
  // Configurar payload para o webhook
  const webhookUrl = (acao == "Aviso Criação" || acao == "Aviso Criado" ? process.env.avisosWebhook : process.env.miscWebhook)
 
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
     case "Imagens Visualizadas":
       return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
     case "Logs Visualizadas":
       return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
     case "Oficial Visualizado":
       return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
     case "Aviso Criação":
       return `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv88o6ldKl7Pv6EWUOg5BZb3UQBy5bTY5nnQ&s`;
     case "Aviso Criado":
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

