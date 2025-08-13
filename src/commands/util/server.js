import { baseEmbed } from '../../utils/embed.js';

export const name = 'server';
export const description = 'Server info.';
export const usage = 'server';

export async function execute(message) {
  const { guild } = message;
  const embed = baseEmbed(message)
    .setTitle('Server Info')
    .addFields(
      { name: 'Name', value: guild.name, inline: true },
      { name: 'Members', value: `${guild.memberCount}`, inline: true },
      { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp/1000)}:R>`, inline: true }
    )
    .setThumbnail(guild.iconURL({ size: 256 }));
  await message.channel.send({ embeds: [embed] });
}
