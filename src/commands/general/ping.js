import { baseEmbed, addLatency, withFooterNote } from '../../utils/embed.js';

export const name = 'ping';
export const description = 'Shows latency.';
export const usage = 'ping';

export async function execute(message) {
  const embed = baseEmbed(message, { banner: false })
    .setTitle('Pong')
    .setDescription('Latency metrics for this shard and message.\nUsage: ping');
  addLatency(embed, message);
  withFooterNote(embed, 'Latency numbers are approximate');
  await message.channel.send({ embeds: [embed] });
}
