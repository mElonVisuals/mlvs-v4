import { PermissionsBitField } from 'discord.js';
import { baseEmbed, EMOJI, errorEmbed, successEmbed } from '../../utils/embed.js';

export const name = 'ban';
export const description = 'Ban a member.';
export const usage = 'ban @user [reason]';

export async function execute(message, args) {
  if (!message.member?.permissions?.has?.(PermissionsBitField.Flags.BanMembers)) {
    const embed = errorEmbed(message, 'Permission Denied', 'You need Ban Members permission.');
    return message.channel.send({ embeds: [embed] });
  }
  const member = message.mentions.members.first();
  if (!member) return message.reply('Mention a user to ban.');
  const reason = args.slice(1).join(' ') || 'No reason provided';
  try {
    await member.ban({ reason });
    const embed = successEmbed(message, `${EMOJI.ban} Member Banned`, `${member.user.tag} was banned.`)
  .addFields({ name: 'Reason', value: reason })
  .setDescription('Usage:\n• ban @user [reason]');
    await message.channel.send({ embeds: [embed] });
  } catch (e) {
    const embed = errorEmbed(message, 'Action Failed', 'Failed to ban member.');
    return message.channel.send({ embeds: [embed] });
  }
}
