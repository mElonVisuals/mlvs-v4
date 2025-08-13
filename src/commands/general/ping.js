import { commandEmbed, addLatency, withFooterNote } from '../../utils/embed.js';

export const name = 'ping';
export const description = 'Shows latency.';
export const usage = 'ping';

export async function execute(message) {
  const embed = commandEmbed(message, { name: 'Pong', usage: 'ping', description: 'Latency metrics for this shard and message.', icon: '🏓' });
  addLatency(embed, message);
  withFooterNote(embed, 'Approximate values');
  await message.channel.send({ embeds: [embed] });
}
