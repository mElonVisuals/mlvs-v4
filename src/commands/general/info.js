import { baseEmbed, LOGO_URL, EMOJI, addBotMetrics, linkify } from '../../utils/embed.js';
import { version as djsVersion } from 'discord.js';

export const name = 'info';
export const description = 'Information about the bot.';
export const usage = 'info';

export async function execute(message, args, client) {
  const embed = baseEmbed(message)
    .setTitle(`${EMOJI.bot} Bot Information`)
    .setDescription([
      `${EMOJI.sparkle} A modern Discord.js bot with a dashboard.`,
      `${EMOJI.link} ${linkify('Open dashboard', process.env.DASHBOARD_URL || `http://localhost:${process.env.PORT || 3005}`)}`,
      '—',
      `Usage:\n• info`,
    ].join('\n'))
    .addFields(
      { name: `${EMOJI.hammer} Prefix`, value: `\`${process.env.PREFIX || '!'}\``, inline: true },
      { name: `${EMOJI.server} Servers`, value: `${client.guilds.cache.size}`, inline: true },
      { name: `${EMOJI.cpu} Node`, value: process.versions.node, inline: true },
      { name: `${EMOJI.bot} discord.js`, value: djsVersion, inline: true },
      { name: `${EMOJI.user} Owner`, value: client.application?.owner?.tag || 'N/A', inline: true },
    )
    .setThumbnail(LOGO_URL);
  addBotMetrics(embed, client);
  await message.channel.send({ embeds: [embed] });
}
