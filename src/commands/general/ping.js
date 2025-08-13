import { baseEmbed, addLatency, EMOJI, withFooterNote } from '../../utils/embed.js';

export const name = 'ping';
export const description = 'Shows latency.';
export const usage = 'ping';

export async function execute(message) {
  const embed = baseEmbed(message)
    .setTitle(`${EMOJI.ping} Pong!`)
    .setDescription([
      `${EMOJI.sparkle} Responsive and ready.`,
      '—',
      `Usage: 
      • ping`,
    ].join('\n'));
  addLatency(embed, message);
  withFooterNote(embed, 'Latency numbers are approximate');
  await message.channel.send({ embeds: [embed] });
}
