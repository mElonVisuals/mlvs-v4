import { baseEmbed, LOGO_URL, addBotMetrics, linkify } from '../utils/embed.js';

export const data = { name: 'info', description: 'Get info about the bot.' };

export async function execute(message, args, client) {
  const embed = baseEmbed(message)
    .setTitle('Bot Information')
    .setDescription(`A modern Discord.js bot with a dashboard. ${linkify('Open dashboard', process.env.DASHBOARD_URL || `http://localhost:${process.env.PORT || 3005}`)}`)
    .addFields(
      { name: 'Prefix', value: `\`${process.env.PREFIX || '!'}\``, inline: true },
      { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true }
    )
    .setThumbnail(LOGO_URL);
  addBotMetrics(embed, client);
  await message.channel.send({ embeds: [embed] });
}
