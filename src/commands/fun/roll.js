export const name = 'roll';
export const description = 'Roll dice (default d6 or NdM e.g. 2d10).';
export const usage = 'roll [dice]';

export async function execute(message, args){
  const input = (args[0]||'d6').toLowerCase();
  const m = input.match(/^(\d*)d(\d+)$/);
  if (!m) return message.reply('Format: NdM e.g. 2d6, 1d20, d8');
  const count = Math.min(20, Math.max(1, parseInt(m[1]||'1',10)));
  const sides = Math.min(1000, Math.max(2, parseInt(m[2],10)));
  const rolls = [];
  for (let i=0;i<count;i++) rolls.push(1+Math.floor(Math.random()*sides));
  const total = rolls.reduce((a,b)=>a+b,0);
  await message.channel.send({ content: `🎲 Rolled ${count}d${sides}: [${rolls.join(', ')}] = **${total}**` });
}
