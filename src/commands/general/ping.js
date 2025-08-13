import { baseEmbed } from '../../utils/embed.js';

export const name = 'ping';
export const description = 'Shows latency.';
export const usage = 'ping';

export async function execute(message) {
  const embed = baseEmbed(message)
    .setTitle('🏓 Pong!')
    .setDescription(`Latency: **${Date.now() - message.createdTimestamp}ms**`);
  await message.channel.send({ embeds: [embed] });
}
