import { baseEmbed } from '../../utils/embed.js';

export const name = 'pingavg';
export const description = 'Average WebSocket latency over last minute (approx).';
export const usage = 'pingavg';

const samples = [];
setInterval(()=>{ if (global.__clientRef) { const v = Math.round(global.__clientRef.ws.ping||0); samples.push(v); if (samples.length>60) samples.shift(); } }, 1000);

export async function execute(message, args, client){
  global.__clientRef = client; // store reference
  const avg = samples.length? Math.round(samples.reduce((a,b)=>a+b,0)/samples.length):0;
  const latest = samples.length ? samples[samples.length-1] : 0;
  const embed = baseEmbed(message)
    .setTitle('📊 Average Latency (60s)')
    .setDescription('Real-time rolling average of the last 60 seconds of WebSocket ping.')
    .addFields(
      { name: 'Average', value: `${avg} ms`, inline: true },
      { name: 'Latest', value: `${latest} ms`, inline: true },
      { name: 'Samples', value: String(samples.length), inline: true },
    );
  await message.channel.send({ embeds: [embed] });
}
