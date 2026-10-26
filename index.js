
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const SOURCE_FORUM_ID = "1447654586872762429";
const FREE_FORUM_ID = "1437532575529832610";
const PREMIUM_FORUM_ID = "1564377016038596699";
const MAO_DO_DIA_CHANNEL_ID = "1437531974565761024";

client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const command = message.content.trim();
  if (command !== "!post" && command !== "!postfree") return;

  const channel = message.channel;

  if (!channel.isThread()) {
    return message.reply("❌ Use o comando dentro de um post do fórum.");
  }

  if (channel.parentId !== SOURCE_FORUM_ID) {
    return message.reply("❌ Use este comando no fórum mãos-prontas.");
  }

  try {
    const firstMessage = await channel.fetchStarterMessage();

    const targetForumId =
      command === "!post"
        ? PREMIUM_FORUM_ID
        : FREE_FORUM_ID;

    const targetForum = await client.channels.fetch(targetForumId);

    const newThread = await targetForum.threads.create({
      name: channel.name,
      message: {
        content: firstMessage.content || " ",
        files: [...firstMessage.attachments.values()].map(a => a.url),
      },
    });

    if (command === "!post") {
      const maoDoDiaChannel = await client.channels.fetch(MAO_DO_DIA_CHANNEL_ID);
      const messages = await maoDoDiaChannel.messages.fetch({ limit: 100 });

      let lastNumber = 0;

      for (const msg of messages.values()) {
        const match = msg.content.match(/MÃO DO DIA\s+(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > lastNumber) lastNumber = num;
        }
      }

      const numeroFormatado = String(lastNumber + 1).padStart(2, "0");

      await maoDoDiaChannel.send(
        `**MÃO DO DIA ${numeroFormatado}**\n${newThread.url}`
      );
    }

    await message.reply(
      command === "!post"
        ? `✅ Mão publicada no Premium: ${newThread.url}`
        : `✅ Mão publicada no canal gratuito: ${newThread.url}`
    );
  } catch (err) {
    console.error(err);
    await message.reply("❌ Erro ao publicar a mão. Verifique as permissões do bot.");
  }
});

client.login(process.env.TOKEN);
