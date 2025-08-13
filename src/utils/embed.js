import { EmbedBuilder } from 'discord.js';

const BRAND_COLOR = 0x5865F2; // blurple
const LOGO_URL = process.env.LOGO_URL || 'https://cdn.discordapp.com/attachments/1335734480253747297/1402442222816989346/logoglow.png?ex=689d281a&is=689bd69a&hm=1acf86e244991b170fcbd1a9b0e68e1a0f25423845fc36e6e7381df4ec36b8eb&';
const BANNER_URL = process.env.BANNER_URL || 'https://cdn.discordapp.com/attachments/1335734480253747297/1402473578254962808/banner3.png?ex=689d454d&is=689bf3cd&hm=ead97252818d9c11ceea7650d0fffe8a783afe8c2d33abd1bdaff51f5c584207&';

export function baseEmbed(messageOrClient) {
  const client = messageOrClient?.client || messageOrClient;
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setAuthor({ name: client?.user?.username || 'Bot', iconURL: LOGO_URL })
    .setThumbnail(LOGO_URL)
    .setImage(BANNER_URL)
    .setFooter({ text: client?.user?.username || 'Bot', iconURL: client?.user?.displayAvatarURL?.() || LOGO_URL })
    .setTimestamp(Date.now());
  return embed;
}

export { BRAND_COLOR, LOGO_URL, BANNER_URL };
