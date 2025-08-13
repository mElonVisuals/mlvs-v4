import { PermissionsBitField } from 'discord.js';

export const name = 'say';
export const description = 'Echo a message (admin).';
export const usage = 'say <text>';

export async function execute(message, args){
  if (!message.member?.permissions?.has?.(PermissionsBitField.Flags.ManageMessages)) return message.reply('Need Manage Messages');
  const text = args.join(' ');
  if (!text) return message.reply('Provide text to send.');
  await message.delete().catch(()=>{});
  await message.channel.send({ content: text });
}
