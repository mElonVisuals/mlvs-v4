import { commandEmbed, addBotMetrics } from '../../utils/embed.js';

export const name = 'stats';
export const description = 'Show bot statistics.';
export const usage = 'stats';

function formatUptime(ms){
  const s = Math.floor(ms/1000); const d = Math.floor(s/86400); const h = Math.floor((s%86400)/3600); const m=Math.floor((s%3600)/60); const sec=s%60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

export async function execute(message, args, client) {
  const embed = commandEmbed(message, { name: 'stats', usage: 'stats', description: 'Bot runtime statistics.', icon: '📈' });
  addBotMetrics(embed, client);
  await message.channel.send({ embeds: [embed] });
}
