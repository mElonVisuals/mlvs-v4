export const name = 'purge';
export const description = 'Bulk delete messages (admin only) with confirmation.';
export const usage = 'purge <1-100> [--yes]';

import { PermissionsBitField } from 'discord.js';
import { errorEmbed, successEmbed } from '../../utils/embed.js';

export async function execute(message, args) {
  if (!message.member?.permissions?.has?.(PermissionsBitField.Flags.ManageMessages)) {
    const embed = errorEmbed(message, 'Permission Denied', 'You need Manage Messages permission.');
    return message.channel.send({ embeds: [embed] });
  }
  const amount = parseInt(args[0], 10);
  if (isNaN(amount) || amount < 1 || amount > 100) return message.reply('Provide a number between 1 and 100.');
  const confirmed = args.includes('--yes');
  if (!confirmed) {
    return message.reply(`Type: \`${process.env.PREFIX || '!'}purge ${amount} --yes\` to confirm deletion.`);
  }
  try {
    await message.channel.bulkDelete(amount, true);
    const embed = successEmbed(message, 'Purge Complete', `Deleted ${amount} messages.`)
      .setDescription('Usage:\n• purge <1-100> [--yes]');
    const msg = await message.channel.send({ embeds: [embed] });
    setTimeout(() => msg.delete().catch(() => {}), 3500);
  } catch (e) {
    const embed = errorEmbed(message, 'Action Failed', 'Failed to delete messages.');
    return message.channel.send({ embeds: [embed] });
  }
}
