import { baseEmbed, LOGO_URL, addBotMetrics, linkify } from '../../utils/embed.js';
import { version as djsVersion } from 'discord.js';

export const name = 'info';
export const description = 'Information about the bot.';
export const usage = 'info';

export async function execute(message, args, client) {
  const embed = baseEmbed(message)
    .setTitle('Bot Information')
    .setDescription([
      'A modern Discord.js bot with a dashboard.',
      `${linkify('Open dashboard', process.env.DASHBOARD_URL || `http://localhost:${process.env.PORT || 3005}`)}`,
      'Usage: info',
    ].join('\n'))
    .addFields(
      { name: 'Prefix', value: `\`${process.env.PREFIX || '!'}\``, inline: true },
      { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
      { name: 'Node', value: process.versions.node, inline: true },
      { name: 'discord.js', value: djsVersion, inline: true },
      { name: 'Owner', value: client.application?.owner?.tag || 'N/A', inline: true },
    )
    .setThumbnail(LOGO_URL);
  addBotMetrics(embed, client);
  await message.channel.send({ embeds: [embed] });
}
