const express = require('express');
const session = require('express-session');

const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios'); 
const os = require('os'); // Para obter informações do sistema


const { Client, GatewayIntentBits } = require('discord.js');


require('dotenv').config({ path: './src/config/.env' });
const port = process.env.port

const app = new express();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

const BOT_TOKEN = process.env.BOT_TOKEN; // Adicione o token do bot no arquivo .env


now = new Date

// ============================= IMPORTANTO ROTAS =============================== //

const router = require(__dirname + '/routes/router');
const homeRoutes = require('./routes/homeRoutes'); 
const inqueritosRoutes = require('./routes/inqueritosRoutes'); 
const oficiaisRoutes = require('./routes/oficiaisRoutes'); 
const blitzRoutes = require('./routes/blitzRoutes'); 
const configRoutes = require('./routes/configRoutes'); 
const { config } = require('dotenv');

// ============================= CONFIG SESSÃO =============================== //

app.use(session({
  secret: 'umasecretaqui',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,  
    secure: false
   } // Altere para true em produção com HTTPS
}));
/*
app.use(session({
    secret: 'corregedoriapaineldoismilvintequadtro#', 
    resave: false,                   
    saveUninitialized: false,         
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,  
        secure: false,                
        httpOnly: true                
    }
}));*/


// ============================= CONFIG EJS =============================== //

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do EJS como view engine
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname) + '/src/views');

// Body parser para requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());




// ============================= CONFIGURANDO ROTAS =============================== //

app.use('/', router);
app.use('/home', homeRoutes);
app.use('/inqueritos', inqueritosRoutes);
app.use('/oficiais', oficiaisRoutes);
app.use('/blitz', blitzRoutes);
app.use('/configuracoes', configRoutes);


// ============================= ENVIANDO WEBHOOK =============================== //
/*async function sendDiscordWebhook() {
    const serverInfo = {
        title: "Servidor Iniciado 🚀",
        description: "O servidor está online com as seguintes informações:",
        fields: [
            { name: "Porta", value: `${port}`, inline: true },
            { name: "Hora", value: `${now.toISOString()}`, inline: true },
            { name: "Ambiente", value: process.env.NODE_ENV || "Desenvolvimento", inline: true },
            { name: "Endereço IP", value: "127.0.0.1", inline: true }, // Substitua por `req.ip` ou algo dinâmico
        ],
        color: 3066993, // Cor do embed no Discord (verde)
    };

    try {
        await axios.post(process.env.statusWebhook, {
            embeds: [serverInfo],
        });
        console.log("✅ » Webhook enviado para o Discord com sucesso!");
    } catch (error) {
        console.error("❌ » Erro ao enviar o webhook:", error.message);
    }
}*/

// ============================= SERVIDOR =============================== //

app.use((req, res, next) => {
    res.status(404).send("Desculpe, não conseguimos encontrar essa página.");
  }) // Erro 404

  app.listen(process.env.PORT, async function (erro) {
    if (erro) {
      console.log("❌ » Erro :" + erro);
    } else {
      console.clear();
      client.login(BOT_TOKEN);
      
      const now = new Date();
      console.log("✅ » Servidor Online atualizado às " + now.getHours() + ":" + now.getMinutes() + " na porta " + port + "...");
  
      try {
        // Enviar informações para o webhook de status
        const webhookUrl = process.env.statusWebhook;
  
        if (webhookUrl) {
          const webhookPayload = {
            embeds: [
              {
                color: 0,
                author: {
                  name: `Server iniciado`,
                  icon_url: "https://media.discordapp.net/attachments/1222972528985772192/1291807066477957183/corr_icon.png?ex=673ebe55&is=673d6cd5&hm=68f8fe8e97fe65b500596900984a3593aaebd4e10608c82636b1b049d8c92846&=&format=webp&quality=lossless&width=662&height=662"
                },
                fields: [
                  { name: 'Hora de Inicialização', value: now.toISOString(), inline: false },
                  { name: 'Porta', value: port, inline: true },
                  { name: 'Ambiente', value: process.env.NODE_ENV || 'Desenvolvimento', inline: true },
                  { name: 'Bot Status', value: client.isReady() ? 'Online' : 'Conectando...', inline: true },
                  { name: 'Hostname', value: os.hostname(), inline: true },
                  { name: 'Sistema Operacional', value: `${os.type()} (${os.platform()} ${os.arch()})`, inline: true },
                  { name: 'Uptime do Sistema', value: `${Math.floor(os.uptime() / 60)} minutos`, inline: true },
                  { name: 'Memória Livre', value: `${Math.round(os.freemem() / 1024 / 1024)} MB`, inline: true },
                  { name: 'Memória Total', value: `${Math.round(os.totalmem() / 1024 / 1024)} MB`, inline: true },
                ],
                footer: {
                  text: 'Sistema de Monitoramento de Status - Painel Corregedoria',
                  icon_url: 'https://media.discordapp.net/attachments/1222972528985772192/1291807066477957183/corr_icon.png?ex=673ebe55&is=673d6cd5&hm=68f8fe8e97fe65b500596900984a3593aaebd4e10608c82636b1b049d8c92846&=&format=webp&quality=lossless&width=662&height=662' // Substituir por um ícone válido
                },
                timestamp: now.toISOString(),
              }
            ]
          };
  
          // Enviar webhook
          await axios.post(webhookUrl, webhookPayload);
          console.log("✅ » Status enviado para o webhook com sucesso.");
        } else {
          console.warn("⚠️ » Webhook de status não configurado. Verifique o arquivo .env.");
        }
      } catch (err) {
        console.error("❌ » Erro ao enviar o status para o webhook:", err.response?.data || err.message);
      }
    }
  });

