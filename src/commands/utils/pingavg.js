export const name = 'pingavg';
export const description = 'Average WebSocket latency over last minute (approx).';
export const usage = 'pingavg';

const samples = [];
setInterval(()=>{ if (global.__clientRef) { const v = Math.round(global.__clientRef.ws.ping||0); samples.push(v); if (samples.length>60) samples.shift(); } }, 1000);

export async function execute(message, args, client){
  global.__clientRef = client; // store reference
  const avg = samples.length? Math.round(samples.reduce((a,b)=>a+b,0)/samples.length):0;
  await message.channel.send({ content: `📊 Avg latency (60s): ${avg} ms (${samples.length} samples)` });
}
