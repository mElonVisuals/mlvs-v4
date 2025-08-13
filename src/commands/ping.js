export const data = { name: 'ping' };

export async function execute(message) {
  const sent = await message.channel.send({
    embeds: [{
      color: 0x5865F2,
      title: '🏓 Pong!',
      description: `Latency: **${Date.now() - message.createdTimestamp}ms**`,
      footer: { text: 'Discord.js Bot', icon_url: message.client.user.displayAvatarURL() },
      timestamp: new Date().toISOString()
    }]
  });
}
