import { commandEmbed } from '../../utils/embed.js';

export const name = 'avatar';
export const description = 'Get a user\'s avatar.';
export const usage = 'avatar [@user]';

export async function execute(message) {
  const user = message.mentions.users.first() || message.author;
  const embed = commandEmbed(message, { name: 'avatar', usage: 'avatar [@user]', description: `Avatar for ${user.username}.`, icon: '🖼️' })
    .setImage(user.displayAvatarURL({ size: 512 }));
  await message.channel.send({ embeds: [embed] });
}
