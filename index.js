const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// 🔴 VAMOS PREENCHER ISSO NO PRÓXIMO PASSO
const DESTINATION_FORUM_ID = "1437532575529832610";

client.once("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content !== "!post") return;

  if (!message.channel.isThread()) {
    return message.reply("❌ Use o comando dentro de um tópico de fórum.");
  }

  const sourceThread = message.channel;
  const sourceForum = sourceThread.parent;

  if (sourceForum.name !== "mãos-prontas") {
    return message.reply("❌ Este comando só funciona em mãos-prontas.");
  }

  const starterMessage = await sourceThread.fetchStarterMessage();
  if (!starterMessage) {
    return message.reply("❌ Não consegui ler o post original.");
  }

  const destinationForum = await message.guild.channels.fetch(
    DESTINATION_FORUM_ID
  );

  await destinationForum.threads.create({
    name: sourceThread.name,
    message: {
      content: starterMessage.content,
    },
  });

  message.reply("✅ Post replicado em discussão-de-mãos.");
});

client.login(process.env.TOKEN);
