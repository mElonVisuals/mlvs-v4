import { baseEmbed, warnEmbed } from '../../utils/embed.js';

export const name = 'roll';
export const description = 'Roll dice (default d6 or NdM e.g. 2d10).';
export const usage = 'roll [dice]';

export async function execute(message, args){
  const input = (args[0]||'d6').toLowerCase();
  const m = input.match(/^(\d*)d(\d+)$/);
  if (!m) {
    const bad = warnEmbed(message, 'Invalid Dice Format', 'Use `NdM` like `2d6`, `1d20`, `d8`.')
      .addFields({ name: 'Example', value: '`roll 3d10`' });
    return message.reply({ embeds: [bad] });
  }
  const count = Math.min(20, Math.max(1, parseInt(m[1]||'1',10)));
  const sides = Math.min(1000, Math.max(2, parseInt(m[2],10)));
  const rolls = Array.from({ length: count }, ()=> 1 + Math.floor(Math.random()*sides));
  const total = rolls.reduce((a,b)=>a+b,0);
  const embed = baseEmbed(message)
    .setTitle(`🎲 Roll Result: ${count}d${sides}`)
    .setDescription(rolls.map((v,i)=>`Die ${i+1}: **${v}**`).join('\n'))
    .addFields(
      { name: 'Total', value: String(total), inline: true },
      { name: 'Average', value: (total/rolls.length).toFixed(2), inline: true },
    );
  await message.channel.send({ embeds: [embed] });
}
