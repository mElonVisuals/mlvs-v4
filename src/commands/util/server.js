import { baseEmbed, addServerFields } from '../../utils/embed.js';

export const name = 'server';
export const description = 'Server info.';
export const usage = 'server';

export async function execute(message) {
  const { guild } = message;
  const embed = baseEmbed(message)
    .setTitle('Server Info')
  .setDescription('Usage:\n• server');
  addServerFields(embed, guild);
  await message.channel.send({ embeds: [embed] });
}
