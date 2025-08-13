import { commandEmbed, addServerFields } from '../../utils/embed.js';

export const name = 'server';
export const description = 'Server info.';
export const usage = 'server';

export async function execute(message) {
  const { guild } = message;
  const embed = commandEmbed(message, { name: 'server', usage: 'server', description: 'Information about this server.', icon: '🏠' });
  addServerFields(embed, guild);
  await message.channel.send({ embeds: [embed] });
}
