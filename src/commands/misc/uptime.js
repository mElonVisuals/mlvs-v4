import { baseEmbed } from '../../utils/embed.js';

export const name = 'uptime';
export const description = 'Show bot uptime.';
export const usage = 'uptime';

export async function execute(message){
  const ms = process.uptime() * 1000;
  const seg = (n,l) => n ? `${n}${l}` : '';
  const d = Math.floor(ms/86400000);
  const h = Math.floor(ms/3600000) % 24;
  const m = Math.floor(ms/60000) % 60;
  const s = Math.floor(ms/1000) % 60;
  const human = [seg(d,'d'), seg(h,'h'), seg(m,'m'), seg(s,'s')].filter(Boolean).join(' ');
  const embed = baseEmbed(message)
    .setTitle('⏱️ Uptime')
    .setDescription(`The bot has been running for **${human}**.`)
    .addFields({ name: 'Milliseconds', value: String(ms), inline: true });
  await message.channel.send({ embeds: [embed] });
}
