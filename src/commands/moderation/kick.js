import { PermissionsBitField } from 'discord.js';
import { baseEmbed } from '../../utils/embed.js';

export const name = 'kick';
export const description = 'Kick a member.';
export const usage = 'kick @user [reason]';

export async function execute(message, args) {
  if (!message.member?.permissions?.has?.(PermissionsBitField.Flags.KickMembers)) {
    return message.reply('You need Kick Members permission.');
  }
  const member = message.mentions.members.first();
  if (!member) return message.reply('Mention a user to kick.');
  const reason = args.slice(1).join(' ') || 'No reason provided';
  try {
    await member.kick(reason);
    const embed = baseEmbed(message)
      .setTitle('Member Kicked')
      .setDescription(`${member.user.tag} was kicked.`)
      .addFields({ name: 'Reason', value: reason });
    await message.channel.send({ embeds: [embed] });
  } catch (e) {
    return message.reply('Failed to kick member.');
  }
}
