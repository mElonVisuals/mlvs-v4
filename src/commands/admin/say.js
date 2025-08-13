import { PermissionsBitField } from 'discord.js';
import { baseEmbed, errorEmbed } from '../../utils/embed.js';

export const name = 'say';
export const description = 'Echo a message (admin).';
export const usage = 'say <text>';

export async function execute(message, args){
  if (!message.member?.permissions?.has?.(PermissionsBitField.Flags.ManageMessages)) {
    return message.reply({ embeds: [errorEmbed(message, 'Permission Required', 'You need **Manage Messages** to use this.')] });
  }
  const text = args.join(' ').trim();
  if (!text) return message.reply({ embeds: [errorEmbed(message, 'No Text Provided', 'Usage: `say <text>`')] });
  await message.delete().catch(()=>{});
  await message.channel.send({ content: text });
  const ack = baseEmbed(message)
    .setTitle('✅ Sent')
    .setDescription('Your message was sent successfully.')
    .addFields({ name: 'Content Preview', value: text.slice(0,200) });
  await message.channel.send({ embeds: [ack] });
}
