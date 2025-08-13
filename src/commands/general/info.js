import { baseEmbed, LOGO_URL } from '../../utils/embed.js';

export const name = 'info';
export const description = 'Information about the bot.';
export const usage = 'info';

export async function execute(message, args, client) {
  const embed = baseEmbed(message)
    .setTitle('Bot Information')
    .setDescription('A modern Discord.js bot with a dashboard.')
    .addFields(
      { name: 'Prefix', value: `\`${process.env.PREFIX || '!'}\``, inline: true },
      { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true }
    )
    .setThumbnail(LOGO_URL);
  await message.channel.send({ embeds: [embed] });
}
