import { baseEmbed } from '../../utils/embed.js';

export const name = 'help';
export const description = 'Show detailed help with categories and usage.';
export const usage = 'help [command]';

export async function execute(message, args, client) {
  const prefix = process.env.PREFIX || '!';
  const q = (args[0]||'').toLowerCase();
  if (q && client.commands.has(q)) {
    const cmd = client.commands.get(q);
    const embed = baseEmbed(message, { banner:false })
      .setTitle(`Help: ${cmd.name}`)
      .setDescription(cmd.description || 'No description provided.')
      .addFields(
        { name: 'Usage', value: `\`${prefix}${cmd.usage || cmd.name}\``, inline: false },
        { name: 'Category', value: cmd.category || 'misc', inline: true }
      );
    return message.channel.send({ embeds: [embed] });
  }

  // Build category map (sorted)
  const cats = Array.from(client.categories.keys()).sort();
  const embed = baseEmbed(message, { banner:false })
    .setTitle('Help Menu')
    .setDescription(`Use \`${prefix}help <command>\` for details. Total commands: **${client.commands.size}**`);

  for (const cat of cats) {
    const list = client.categories.get(cat) || [];
    const lines = list
      .sort((a,b)=>a.name.localeCompare(b.name))
      .map(cmd => `\`${prefix}${cmd.usage || cmd.name}\` — ${cmd.description || 'No description'}`)
      .join('\n');
    embed.addFields({ name: cat.charAt(0).toUpperCase()+cat.slice(1), value: lines || '*No commands*', inline: false });
  }

  await message.channel.send({ embeds: [embed] });
}
