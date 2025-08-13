export const data = { name: 'info', description: 'Get info about the bot.' };

export async function execute(message, args, client) {
  const embed = {
    color: 0x5865F2,
    title: 'Bot Information',
    description: 'A modern Discord.js bot with a dashboard.',
    fields: [
      { name: 'Prefix', value: process.env.PREFIX || '!', inline: true },
      { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true }
    ],
    footer: { text: 'Discord.js Bot', icon_url: message.client.user.displayAvatarURL() },
    timestamp: new Date().toISOString()
  };
  await message.channel.send({ embeds: [embed] });
}
