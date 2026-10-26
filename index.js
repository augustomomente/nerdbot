const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const SOURCE_FORUM_ID = "1447654586872762429"; // mãos-prontas
const FREE_FORUM_ID = "1437532575529832610"; // discussão-de-mãos
const PREMIUM_FORUM_ID = "1564377016038596699"; // mãos-premium
const MAO_DO_DIA_CHANNEL_ID = "1437531974565761024"; // mão-do-dia

client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const command = message.content.trim();

  if (command !== "!post" && command !== "!postfree") return;

  const channel = message.channel;

  // O comando precisa ser usado dentro de um tópico de fórum
  if (!channel.isThread()) {
    return message.reply(
      "❌ Use o comando dentro de um post do fórum."
    );
  }

  // O comando só pode ser usado no fórum mãos-prontas
  if (channel.parentId !== SOURCE_FORUM_ID) {
    return message.reply(
      "❌ Use este comando dentro do fórum mãos-prontas."
    );
  }

  try {
    // Busca a primeira mensagem do tópico original
    const firstMessage = await channel.fetchStarterMessage();

    // Define o fórum de destino conforme o comando
    const targetForumId =
      command === "!post"
        ? PREMIUM_FORUM_ID
        : FREE_FORUM_ID;

    const targetForum = await client.channels.fetch(targetForumId);

    // Publica a mão no fórum de destino
    const newThread = await targetForum.threads.create({
      name: channel.name,
      message: {
        content: firstMessage.content || " ",
        files: [...firstMessage.attachments.values()].map(
          (attachment) => attachment.url
        ),
      },
    });

    // Somente !post publica no canal mão-do-dia
    if (command === "!post") {
      const maoDoDiaChannel = await client.channels.fetch(
        MAO_DO_DIA_CHANNEL_ID
      );

      // Busca as últimas mensagens para identificar a numeração
      const messages = await maoDoDiaChannel.messages.fetch({
        limit: 100,
      });

      let lastNumber = 0;

      for (const msg of messages.values()) {
        const match = msg.content.match(/MÃO DO DIA\s+(\d+)/);

        if (match) {
          const num = parseInt(match[1], 10);

          if (num > lastNumber) {
            lastNumber = num;
          }
        }
      }

      const maoDoDiaNumber = lastNumber + 1;
      const numeroFormatado = String(maoDoDiaNumber).padStart(2, "0");

      // Publica na ordem solicitada:
      // 1. Número da mão
      // 2. Link para a mão
      // 3. Título da mão
      // 4. Aviso de exclusividade Premium
      await maoDoDiaChannel.send(
        `**MÃO DO DIA ${numeroFormatado}**\n` +
        `${newThread.url}\n` +
        `**${channel.name}**\n` +
        `🔒 Mão exclusiva para membros Premium 🔒`
      );
    }

    // Confirma a publicação no tópico original
    await message.reply(
      command === "!post"
        ? `✅ Mão publicada no Premium: ${newThread.url}`
        : `✅ Mão publicada no canal gratuito: ${newThread.url}`
    );
  } catch (err) {
    console.error(err);

    await message.reply(
      "❌ Erro ao publicar a mão. Verifique as permissões do bot."
    );
  }
});

client.login(process.env.TOKEN);
