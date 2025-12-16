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
const MAO_DO_DIA_CHANNEL_ID = "1437531974565761024";

client.once("ready", async () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content !== "!post") return;

  const channel = message.channel;

  if (!channel.isThread()) {
    return message.reply("❌ Use o comando dentro de um post do fórum.");
  }

  if (channel.parentId !== SOURCE_FORUM_ID) {
    return message.reply("❌ Este comando só funciona no fórum mãos-prontas.");
  }

  try {
    const parentForum = await client.channels.fetch(TARGET_FORUM_ID);
    const maoDoDiaChannel = await client.channels.fetch(MAO_DO_DIA_CHANNEL_ID);

    const firstMessage = await channel.fetchStarterMessage();

    const newThread = await parentForum.threads.create({
      name: channel.name,
      message: {
        content: firstMessage.content || " ",
        files: firstMessage.attachments.map(a => a.url),
      },
    });

    // conta quantas mensagens já existem no canal mão-do-dia
    const messages = await maoDoDiaChannel.messages.fetch({ limit: 100 });
    const maoDoDiaNumber = messages.filter(m =>
      m.content.startsWith("MÃO DO DIA")
    ).size + 1;

    const numeroFormatado = String(maoDoDiaNumber).padStart(2, "0");

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

