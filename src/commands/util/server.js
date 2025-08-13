import { baseEmbed, addServerFields, EMOJI } from '../../utils/embed.js';

export const name = 'server';
export const description = 'Server info.';
export const usage = 'server';

export async function execute(message) {
  const { guild } = message;
  const embed = baseEmbed(message)
    .setTitle(`${EMOJI.server} Server Info`);
  addServerFields(embed, guild);
  await message.channel.send({ embeds: [embed] });
}
