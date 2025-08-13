import { commandEmbed } from '../../utils/embed.js';

export const name = 'coinflip';
export const description = 'Flip a coin.';
export const usage = 'coinflip';

export async function execute(message) {
  const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
  const embed = commandEmbed(message, { name: 'coinflip', usage: 'coinflip', description: 'Flip a virtual coin.', icon: '🪙' })
    .addFields({ name: 'Result', value: `**${result}**`, inline: true });
  await message.channel.send({ embeds: [embed] });
}
