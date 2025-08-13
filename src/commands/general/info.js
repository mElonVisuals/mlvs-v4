import { baseEmbed, LOGO_URL, EMOJI, addBotMetrics, linkify } from '../../utils/embed.js';

export const name = 'info';
export const description = 'Information about the bot.';
export const usage = 'info';

export async function execute(message, args, client) {
  const embed = baseEmbed(message)
    .setTitle(`${EMOJI.bot} Bot Information`)
    .setDescription(`${EMOJI.sparkle} A modern Discord.js bot with a dashboard. ${EMOJI.link} ${linkify('Open dashboard', process.env.DASHBOARD_URL || `http://localhost:${process.env.PORT || 3005}`)}`)
    .addFields(
      { name: `${EMOJI.hammer} Prefix`, value: `\`${process.env.PREFIX || '!'}\``, inline: true },
      { name: `${EMOJI.server} Servers`, value: `${client.guilds.cache.size}`, inline: true }
    )
    .setThumbnail(LOGO_URL);
  addBotMetrics(embed, client);
  await message.channel.send({ embeds: [embed] });
}
