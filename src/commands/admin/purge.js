export const name = 'purge';
export const description = 'Bulk delete messages (admin only).';
export const usage = 'purge <1-100>';

import { PermissionsBitField } from 'discord.js';

export async function execute(message, args) {
  if (!message.member?.permissions?.has?.(PermissionsBitField.Flags.ManageMessages)) {
    return message.reply('You need Manage Messages permission.');
  }
  const amount = parseInt(args[0], 10);
  if (isNaN(amount) || amount < 1 || amount > 100) return message.reply('Provide a number between 1 and 100.');
  try {
    await message.channel.bulkDelete(amount, true);
    const msg = await message.channel.send(`Deleted ${amount} messages.`);
    setTimeout(() => msg.delete().catch(() => {}), 3000);
  } catch (e) {
    return message.reply('Failed to delete messages.');
  }
}
