export const name = 'uptime';
export const description = 'Show bot uptime.';
export const usage = 'uptime';

export async function execute(message, args, client){
  const ms = process.uptime()*1000;
  const fmt = (n,l) => n? `${n}${l}`:'';
  const d = Math.floor(ms/86400000);
  const h = Math.floor(ms/3600000)%24;
  const m = Math.floor(ms/60000)%60;
  const s = Math.floor(ms/1000)%60;
  const pretty = [fmt(d,'d'),fmt(h,'h'),fmt(m,'m'),fmt(s,'s')].filter(Boolean).join(' ');
  await message.channel.send({ content: `⏱️ Uptime: ${pretty}` });
}
