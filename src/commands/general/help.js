import { baseEmbed } from '../../utils/embed.js';

export const name = 'help';
export const description = 'Show detailed help with categories.';
export const usage = 'help [command]';

export async function execute(message, args, client) {
  const prefix = process.env.PREFIX || '!';
  const query = args[0]?.toLowerCase();
  if (query && client.commands.has(query)) {
    const cmd = client.commands.get(query);
    const embed = baseEmbed(message)
      .setTitle(`Help: ${cmd.name}`)
      .setDescription(cmd.description || 'No description.')
      .addFields(
        { name: 'Usage', value: `\`${prefix}${cmd.usage || cmd.name}\``, inline: false }
      );
    return message.channel.send({ embeds: [embed] });
  }

  const embed = baseEmbed(message)
    .setTitle('Help Menu')
  .setDescription('Browse commands by category. Use `!help <command>` for details.')
    .addFields(
      ...Array.from(client.categories.keys()).map(cat => ({
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        value: client.categories.get(cat).map(c => `• **${c.name}** — ${c.description || 'No description'}`).join('\n') || 'No commands',
        inline: false
      }))
    );
  await message.channel.send({ embeds: [embed] });
}
