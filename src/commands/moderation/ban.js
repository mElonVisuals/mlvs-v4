import { PermissionsBitField } from 'discord.js';
import { errorEmbed, successEmbed } from '../../utils/embed.js';

export const name = 'ban';
export const description = 'Ban a member.';
export const usage = 'ban @user [reason]';

export async function execute(message, args) {
  if (!message.member?.permissions?.has?.(PermissionsBitField.Flags.BanMembers)) {
    const embed = errorEmbed(message, 'Permission Denied', 'You need Ban Members permission.');
    return message.channel.send({ embeds: [embed] });
  }
  const member = message.mentions.members.first();
  if (!member) return message.reply({ embeds:[errorEmbed(message,'User Required','Mention a user to ban.')] });
  const reason = args.slice(1).join(' ') || 'No reason provided';
  try {
    await member.ban({ reason });
  const embed = successEmbed(message, 'Member Banned', `${member.user.tag} was banned.`)
  .addFields({ name: 'Reason', value: reason });
    await message.channel.send({ embeds: [embed] });
  } catch (e) {
    const embed = errorEmbed(message, 'Action Failed', 'Failed to ban member.');
    return message.channel.send({ embeds: [embed] });
  }
}
