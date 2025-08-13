import { baseEmbed } from '../../utils/embed.js';

export const name = 'coinflip';
export const description = 'Flip a coin.';
export const usage = 'coinflip';

export async function execute(message) {
  const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
  const embed = baseEmbed(message, { banner: false })
    .setTitle('Coin Flip')
  .setDescription(['Usage:\n• coinflip', '—', `Result: **${result}**`].join('\n'));
  await message.channel.send({ embeds: [embed] });
}
