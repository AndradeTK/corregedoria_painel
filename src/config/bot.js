

const { Client, GatewayIntentBits, version: discordJsVersion } = require('discord.js');
const axios = require('axios');
const os = require('os'); // Para obter informações do sistema
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ]
});
const BOT_TOKEN = process.env.BOT_TOKEN;
const botWebhook = process.env.botWebhook; // URL do webhook para status do bot

// Evento de inicialização do bot
client.once('ready', async () => {
  console.log(`✅ » Bot conectado como ${client.user.tag}`);
  client.user.setActivity('corregedoriapmc.com', { type: 'LISTENING' })


  try {
    if (botWebhook) {
      const guilds = await client.guilds.fetch(); // Obter a lista de servidores
      const totalGuilds = guilds.size;

      // Obter total de membros
      let totalMembers = 0;
      for (const guild of guilds.values()) {
        const fetchedGuild = await guild.fetch();
        totalMembers += fetchedGuild.memberCount;
      }

      // Montar payload para o webhook
      const webhookPayload = {
        embeds: [
          {

            color: 0, // Azul
            author: {
              name: `Bot iniciado - ${client.user.username}`,
              icon_url: client.user.displayAvatarURL()
            },
            fields: [
              { name: 'Bot', value: client.user.username, inline: true },
              { name: 'Bot ID', value: client.user.id, inline: true },
              { name: 'Discriminator', value: client.user.discriminator, inline: true },
              { name: 'Status', value: client.presence?.status || 'Indisponível', inline: true },
              { name: 'Servidores Conectados', value: `${totalGuilds}`, inline: true },
              { name: 'Total de Membros', value: `${totalMembers}`, inline: true },
              { name: 'Versão do Node.js', value: process.version, inline: true },
              { name: 'Versão do Discord.js', value: discordJsVersion, inline: true },
              { name: 'Hostname', value: os.hostname(), inline: true },
              { name: 'Sistema Operacional', value: `${os.type()} (${os.platform()} ${os.arch()})`, inline: true },
              { name: 'Uptime do Sistema', value: `${Math.floor(os.uptime() / 60)} minutos`, inline: true },
              { name: 'Memória Livre', value: `${Math.round(os.freemem() / 1024 / 1024)} MB`, inline: true },
              { name: 'Memória Total', value: `${Math.round(os.totalmem() / 1024 / 1024)} MB`, inline: true },
              { name: 'Hora de Inicialização', value: new Date().toISOString(), inline: false },
            ],
            thumbnail: {
              url: client.user.displayAvatarURL()
            },
            footer: {
              text: 'Sistema de Monitoramento de Bots - Painel Corregedoria',
              icon_url: 'https://media.discordapp.net/attachments/1222972528985772192/1291807066477957183/corr_icon.png?ex=673ebe55&is=673d6cd5&hm=68f8fe8e97fe65b500596900984a3593aaebd4e10608c82636b1b049d8c92846&=&format=webp&quality=lossless&width=662&height=662' // Substitua pelo ícone desejado
            },
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Enviar informações para o webhook
      await axios.post(botWebhook, webhookPayload);
      console.log("✅ » Status do bot enviado para o webhook com sucesso.");
    } else {
      console.warn("⚠️ » Webhook de status do bot não configurado. Verifique o arquivo .env.");
    }
  } catch (err) {
    console.error("❌ » Erro ao enviar o status do bot para o webhook:", err.response?.data || err.message);
  }
});

// Função para verificar se um usuário tem um cargo específico
async function userHasRole(guildId, userId, roleId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);

    // Verifica se o usuário tem o cargo
    return member.roles.cache.has(roleId);
  } catch (err) {
    console.error('Erro ao buscar membro ou cargo:', err);
    return false;
  }
}

// Logar o bot
client.login(BOT_TOKEN);

module.exports = { userHasRole };
