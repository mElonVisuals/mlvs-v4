import { baseEmbed, linkify, addBotMetrics } from '../../utils/embed.js';
import fetch from 'node-fetch';

export const name = 'dashboard';
export const description = 'Show the dashboard link and status.';
export const usage = 'dashboard';

export async function execute(message, args, client) {
  const url = process.env.DASHBOARD_URL || `http://localhost:${process.env.PORT || 3005}`;
  let status = 'Unknown';
  try {
    const res = await fetch(`${url}/api/status`, { timeout: 2000 });
    if (res.ok) {
      const js = await res.json();
      status = js?.ok ? 'Online' : 'Degraded';
    } else status = 'Offline';
  } catch {
    status = 'Offline';
  }
  const embed = baseEmbed(message)
    .setTitle('Dashboard')
    .setDescription(`Manage the bot here: ${linkify('Open Dashboard', url)}`)
    .addFields(
      { name: 'Status', value: status, inline: true },
      { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true }
    );
  addBotMetrics(embed, client);
  await message.channel.send({ embeds: [embed] });
}
