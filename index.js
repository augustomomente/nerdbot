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

client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content !== "!post") return;

  const channel = message.channel;

  // só funciona dentro de post de fórum
  if (!channel.isThread()) {
    return message.reply("❌ Use o comando dentro de um post do fórum.");
  }

  // verifica se o post é do fórum correto
  if (channel.parentId !== SOURCE_FORUM_ID) {
    return message.reply("❌ Este comando só funciona no fórum mãos-prontas.");
  }

  try {
    const parentForum = await client.channels.fetch(TARGET_FORUM_ID);

    const messages = await channel.messages.fetch({ limit: 1 });
    const firstMessage = messages.first();

    const newThread = await parentForum.threads.create({
      name: channel.name,
      message: {
        content: firstMessage.content || " ",
        embeds: firstMessage.embeds,
      },
    });

    await message.reply(`✅ Post replicado com sucesso em ${newThread.url}`);
  } catch (err) {
    console.error(err);
    message.reply("❌ Erro ao replicar o post.");
  }
});

client.login(process.env.TOKEN);
