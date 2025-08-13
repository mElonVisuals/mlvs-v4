import { baseEmbed } from '../../utils/embed.js';

export const name = 'dashboard';
export const description = 'Show the dashboard link and status.';
export const usage = 'dashboard';

export async function execute(message, args, client) {
  const url = process.env.DASHBOARD_URL || `http://localhost:${process.env.PORT || 3005}`;
  const embed = baseEmbed(message)
    .setTitle('Dashboard')
    .setDescription(`Open the dashboard here: **${url}**`)
    .addFields(
      { name: 'Status', value: 'Online', inline: true },
      { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true }
    );
  await message.channel.send({ embeds: [embed] });
}
