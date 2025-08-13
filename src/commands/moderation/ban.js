import { PermissionsBitField } from 'discord.js';
import { baseEmbed } from '../../utils/embed.js';

export const name = 'ban';
export const description = 'Ban a member.';
export const usage = 'ban @user [reason]';

export async function execute(message, args) {
  if (!message.member?.permissions?.has?.(PermissionsBitField.Flags.BanMembers)) {
    return message.reply('You need Ban Members permission.');
  }
  const member = message.mentions.members.first();
  if (!member) return message.reply('Mention a user to ban.');
  const reason = args.slice(1).join(' ') || 'No reason provided';
  try {
    await member.ban({ reason });
    const embed = baseEmbed(message)
      .setTitle('Member Banned')
      .setDescription(`${member.user.tag} was banned.`)
      .addFields({ name: 'Reason', value: reason });
    await message.channel.send({ embeds: [embed] });
  } catch (e) {
    return message.reply('Failed to ban member.');
  }
}
