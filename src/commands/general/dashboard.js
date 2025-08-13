import { baseEmbed, EMOJI, linkify, addBotMetrics } from '../../utils/embed.js';

export const name = 'dashboard';
export const description = 'Show the dashboard link and status.';
export const usage = 'dashboard';

export async function execute(message, args, client) {
  const url = process.env.DASHBOARD_URL || `http://localhost:${process.env.PORT || 3005}`;
  const embed = baseEmbed(message)
    .setTitle(`${EMOJI.dashboard} Dashboard`)
    .setDescription(`Manage the bot here: ${linkify('Open Dashboard', url)}`)
    .addFields(
      { name: `${EMOJI.success} Status`, value: 'Online', inline: true },
      { name: `${EMOJI.server} Servers`, value: `${client.guilds.cache.size}`, inline: true }
    );
  addBotMetrics(embed, client);
  await message.channel.send({ embeds: [embed] });
}
