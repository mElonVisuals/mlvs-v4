import fs from 'fs';
import path from 'path';
import { PermissionsBitField } from 'discord.js';
import { errorEmbed, successEmbed } from '../../utils/embed.js';

export const name = 'setprefix';
export const description = 'Set a new command prefix (admin).';
export const usage = 'setprefix <newPrefix>';

export async function execute(message, args) {
  if (!message.member?.permissions?.has?.(PermissionsBitField.Flags.Administrator)) {
  const embed = errorEmbed(message, 'Permission Denied', 'You need Administrator permission.');
  return message.channel.send({ embeds: [embed] });
  }
  const newPrefix = args[0];
  if (!newPrefix) return message.reply({ embeds:[errorEmbed(message,'Prefix Required','Provide a new prefix.')] });

  try {
    const envPath = path.join(process.cwd(), '.env');
    const raw = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const out = [];
    let found = false;
    for (const line of lines) {
      if (line.startsWith('PREFIX=')) { out.push(`PREFIX=${newPrefix}`); found = true; }
      else out.push(line);
    }
    if (!found) out.push(`PREFIX=${newPrefix}`);
    fs.writeFileSync(envPath, out.join('\n'));
  } catch {}

  process.env.PREFIX = newPrefix;
  const embed = successEmbed(message, 'Prefix Updated', `Prefix set to \`${newPrefix}\``);
  return message.channel.send({ embeds: [embed] });
}
