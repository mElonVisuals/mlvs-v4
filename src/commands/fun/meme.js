import { baseEmbed } from '../../utils/embed.js';

export const name = 'meme';
export const description = 'Send a random meme (placeholder).';
export const usage = 'meme';

const memes = [
  'https://i.imgur.com/W3W2b.jpg',
  'https://i.imgur.com/4M7IWwP.jpeg',
  'https://i.imgur.com/oYiTqum.jpeg'
];

export async function execute(message) {
  const embed = baseEmbed(message)
    .setTitle('Random Meme')
    .setImage(memes[Math.floor(Math.random()*memes.length)]);
  await message.channel.send({ embeds: [embed] });
}
