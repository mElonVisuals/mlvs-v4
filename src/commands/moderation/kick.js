import { PermissionsBitField } from 'discord.js';
import { errorEmbed, successEmbed } from '../../utils/embed.js';

export const name = 'kick';
export const description = 'Kick a member.';
export const usage = 'kick @user [reason]';

export async function execute(message, args) {
  if (!message.member?.permissions?.has?.(PermissionsBitField.Flags.KickMembers)) {
  const embed = errorEmbed(message, 'Permission Denied', 'You need Kick Members permission.');
    return message.channel.send({ embeds: [embed] });
  }
  const member = message.mentions.members.first();
  if (!member) return message.reply('Mention a user to kick.');
  const reason = args.slice(1).join(' ') || 'No reason provided';
  try {
    await member.kick(reason);
  const embed = successEmbed(message, 'Member Kicked', `${member.user.tag} was kicked.`)
  .addFields({ name: 'Reason', value: reason })
  .setDescription('Usage:\n• kick @user [reason]');
    await message.channel.send({ embeds: [embed] });
  } catch (e) {
    const embed = errorEmbed(message, 'Action Failed', 'Failed to kick member.');
    return message.channel.send({ embeds: [embed] });
  }
}
