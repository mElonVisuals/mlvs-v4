import { PermissionsBitField } from 'discord.js';
import { errorEmbed, successEmbed } from '../../utils/embed.js';

export const name = 'slowmode';
export const description = 'Set channel slowmode (seconds).';
export const usage = 'slowmode <seconds|off>';

export async function execute(message, args){
  if (!message.member?.permissions?.has?.(PermissionsBitField.Flags.ManageChannels)) {
    return message.channel.send({ embeds:[errorEmbed(message,'Permission Denied','Need Manage Channels.')] });
  }
  const val = args[0];
  if (!val) return message.reply(`Usage: ${(process.env.PREFIX||'!')}slowmode <seconds|off>`);
  let seconds = 0;
  if (val.toLowerCase() !== 'off') {
    seconds = parseInt(val,10);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) return message.reply('Seconds must be between 0 and 21600 (6h).');
  }
  try {
    await message.channel.setRateLimitPerUser(seconds, `Slowmode set by ${message.author.tag}`);
    return message.channel.send({ embeds:[successEmbed(message,'Slowmode Updated', seconds? `${seconds}s`:'Off')] });
  } catch {
    return message.channel.send({ embeds:[errorEmbed(message,'Failed','Could not update slowmode.')] });
  }
}
