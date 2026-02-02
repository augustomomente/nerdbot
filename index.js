const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const SOURCE_FORUM_ID = "1447654586872762429"; // mãos-prontas
const TARGET_FORUM_ID = "1437532575529832610"; // discussão-de-mãos
const MAO_DO_DIA_CHANNEL_ID = "1437531974565761024"; // mão-do-dia

client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content !== "!post") return;

  const channel = message.channel;

  // precisa ser post de fórum
  if (!channel.isThread()) {
    return message.reply("❌ Use o comando dentro de um post do fórum.");
  }

  // precisa ser do fórum mãos-prontas
  if (channel.parentId !== SOURCE_FORUM_ID) {
    return message.reply("❌ Este comando só funciona no fórum mãos-prontas.");
  }

  try {
    const parentForum = await client.channels.fetch(TARGET_FORUM_ID);
    const maoDoDiaChannel = await client.channels.fetch(MAO_DO_DIA_CHANNEL_ID);

    // mensagem original do post
    const firstMessage = await channel.fetchStarterMessage();

    // cria o novo post replicado
    const newThread = await parentForum.threads.create({
      name: channel.name,
      message: {
        content: firstMessage.content || " ",
        files: [...firstMessage.attachments.values()].map(a => a.url),
      },
    });

    // busca mensagens do canal mão-do-dia para achar o último número
    const messages = await maoDoDiaChannel.messages.fetch({ limit: 100 });

    let lastNumber = 0;

    for (const msg of messages.values()) {
      const match = msg.content.match(/MÃO DO DIA\s+(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > lastNumber) lastNumber = num;
      }
    }

    const maoDoDiaNumber = lastNumber + 1;
    const numeroFormatado = String(maoDoDiaNumber).padStart(2, "0");

    // envia no canal mão-do-dia
    await maoDoDiaChannel.send(
  `**MÃO DO DIA ${numeroFormatado}**\n${newThread.url}`
);


    await message.reply(`✅ Post replicado com sucesso em ${newThread.url}`);
  } catch (err) {
    console.error(err);
    message.reply("❌ Erro ao replicar o post.");
  }
});

client.login(process.env.TOKEN);


