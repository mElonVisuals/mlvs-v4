import { commandEmbed, addUserFields } from '../../utils/embed.js';

export const name = 'userinfo';
export const description = 'Show information about a user.';
export const usage = 'userinfo [@user]';

export async function execute(message) {
  const user = message.mentions.users.first() || message.author;
  const member = await message.guild.members.fetch(user.id).catch(() => null);
  const embed = commandEmbed(message, { name: 'userinfo', usage: 'userinfo [@user]', description: `Information about ${user.username}.`, icon: '👤' });
  addUserFields(embed, user, member);
  if (member?.joinedTimestamp) {
    embed.addFields({ name: 'Joined', value: `<t:${Math.floor(member.joinedTimestamp/1000)}:R>`, inline: true });
  }
  await message.channel.send({ embeds: [embed] });
}
