require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const DESTINATION_FORUM_ID = "1437532575529832610";

// 🔒 Timeout helper
function withTimeout(promise, ms, errorMsg) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    ),
  ]);
}

client.once("ready", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content !== "!post") return;

  console.log("📩 Comando recebido:", message.content);

  // ⚡ resposta imediata
  message.channel.send("⏳ Processando...");

  try {
    if (!message.channel.isThread()) {
      return message.channel.send(
        "❌ Use o comando dentro de um tópico de fórum."
      );
    }

    const sourceThread = message.channel;
    const sourceForum = sourceThread.parent;

    if (!sourceForum || sourceForum.name !== "mãos-prontas") {
      return message.channel.send(
        "❌ Este comando só funciona em mãos-prontas."
      );
    }

    console.log("📂 Thread:", sourceThread.name);

    // 🔒 busca com timeout
    const starterMessage = await withTimeout(
      sourceThread.fetchStarterMessage(),
      5000,
      "Timeout ao buscar mensagem"
    );

    if (!starterMessage) {
      return message.channel.send(
        "❌ Não consegui ler o post original."
      );
    }

    console.log("📄 Mensagem carregada");

    // 🔥 remove @everyone e @here
    const cleanContent = starterMessage.content
      .replace(/@everyone/g, "")
      .replace(/@here/g, "")
      .trim();

    const destinationForum = await withTimeout(
      message.guild.channels.fetch(DESTINATION_FORUM_ID),
      5000,
      "Timeout ao buscar fórum"
    );

    console.log("📍 Fórum encontrado");

    await withTimeout(
      destinationForum.threads.create({
        name: sourceThread.name,
        message: {
          content: cleanContent || "(post sem texto)",
        },
      }),
      8000,
      "Timeout ao criar thread"
    );

    console.log("✅ Post criado");

    message.channel.send("✅ Post replicado com sucesso!");
  } catch (err) {
    console.error("❌ ERRO:", err.message);

    message.channel.send(
      "❌ Erro ao processar (timeout ou falha da API)."
    );
  }
});
client.login(process.env.NERDBOT_TOKEN);
