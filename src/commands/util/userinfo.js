import { baseEmbed } from '../../utils/embed.js';

export const name = 'userinfo';
export const description = 'Show information about a user.';
export const usage = 'userinfo [@user]';

export async function execute(message) {
  const user = message.mentions.users.first() || message.author;
  const member = await message.guild.members.fetch(user.id).catch(() => null);
  const roles = member ? member.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.toString()).slice(0, 10).join(', ') || 'None' : 'N/A';
  const embed = baseEmbed(message)
    .setTitle(`${user.username}`)
    .addFields(
      { name: 'ID', value: user.id, inline: true },
      { name: 'Joined', value: member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:R>` : 'N/A', inline: true },
      { name: 'Created', value: `<t:${Math.floor(user.createdTimestamp/1000)}:R>`, inline: true },
      { name: 'Roles', value: roles, inline: false }
    )
    .setThumbnail(user.displayAvatarURL({ size: 256 }));
  await message.channel.send({ embeds: [embed] });
}
