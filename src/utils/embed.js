import { EmbedBuilder } from 'discord.js';

// Branding and assets
const BRAND_COLOR = Number(process.env.BRAND_COLOR) || 0x5865F2; // blurple
const SECONDARY_COLOR = Number(process.env.SECONDARY_COLOR) || 0x2B2D31; // dark gray
const SUCCESS_COLOR = Number(process.env.SUCCESS_COLOR) || 0x57F287; // green
const DANGER_COLOR = Number(process.env.DANGER_COLOR) || 0xED4245; // red
const WARNING_COLOR = Number(process.env.WARNING_COLOR) || 0xFEE75C; // yellow

const LOGO_URL = process.env.LOGO_URL || 'https://cdn.discordapp.com/attachments/1335734480253747297/1402442222816989346/logoglow.png?ex=689d281a&is=689bd69a&hm=1acf86e244991b170fcbd1a9b0e68e1a0f25423845fc36e6e7381df4ec36b8eb&';
const BANNER_URL = process.env.BANNER_URL || 'https://cdn.discordapp.com/attachments/1335734480253747297/1402473578254962808/banner3.png?ex=689d454d&is=689bf3cd&hm=ead97252818d9c11ceea7650d0fffe8a783afe8c2d33abd1bdaff51f5c584207&';

// Emoji registry (fallbacks if custom IDs are not provided)
const EMOJI = {
  ping: process.env.EMOJI_PING || '🏓',
  info: process.env.EMOJI_INFO || 'ℹ️',
  dashboard: process.env.EMOJI_DASHBOARD || '🖥️',
  success: process.env.EMOJI_SUCCESS || '✅',
  error: process.env.EMOJI_ERROR || '❌',
  warn: process.env.EMOJI_WARN || '⚠️',
  bot: process.env.EMOJI_BOT || '🤖',
  server: process.env.EMOJI_SERVER || '🛡️',
  user: process.env.EMOJI_USER || '👤',
  roles: process.env.EMOJI_ROLES || '🎭',
  rocket: process.env.EMOJI_ROCKET || '🚀',
  link: process.env.EMOJI_LINK || '🔗',
  memory: process.env.EMOJI_MEMORY || '🧠',
  cpu: process.env.EMOJI_CPU || '🧮',
  time: process.env.EMOJI_TIME || '⏱️',
  hammer: process.env.EMOJI_HAMMER || '🛠️',
  broom: process.env.EMOJI_BROOM || '🧹',
  ban: process.env.EMOJI_BAN || '🔨',
  kick: process.env.EMOJI_KICK || '👢',
  coin: process.env.EMOJI_COIN || '🪙',
  ball: process.env.EMOJI_BALL || '🎱',
  sparkle: process.env.EMOJI_SPARKLE || '✨',
};

// Helpers
const safe = (v) => (v === undefined || v === null ? 'N/A' : String(v));
const fmt = {
  num: (n) => new Intl.NumberFormat().format(Number(n || 0)),
  bytes: (b) => `${(Number(b) / 1024 / 1024).toFixed(1)} MB`,
  uptime: (ms) => {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${d}d ${h}h ${m}m ${sec}s`;
  },
  ts: (ms) => `<t:${Math.floor(ms / 1000)}:R>`,
};

function computeAuthor(client) {
  const name = client?.user?.username || 'Bot';
  const iconURL = client?.user?.displayAvatarURL?.() || LOGO_URL;
  return { name, iconURL };
}

// Core base embed with branding
export function baseEmbed(messageOrClient) {
  const client = messageOrClient?.client || messageOrClient;
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setAuthor(computeAuthor(client))
    .setThumbnail(LOGO_URL)
    .setImage(BANNER_URL)
    .setFooter({ text: client?.user?.username || 'Bot', iconURL: computeAuthor(client).iconURL })
    .setTimestamp(Date.now());
  return embed;
}

// Variants
export function successEmbed(ctx, title, description) {
  return baseEmbed(ctx).setColor(SUCCESS_COLOR).setTitle(`${EMOJI.success} ${title}`).setDescription(description || '');
}

export function errorEmbed(ctx, title, description) {
  return baseEmbed(ctx).setColor(DANGER_COLOR).setTitle(`${EMOJI.error} ${title}`).setDescription(description || '');
}

export function infoEmbed(ctx, title, description) {
  return baseEmbed(ctx).setColor(BRAND_COLOR).setTitle(`${EMOJI.info} ${title}`).setDescription(description || '');
}

export function warnEmbed(ctx, title, description) {
  return baseEmbed(ctx).setColor(WARNING_COLOR).setTitle(`${EMOJI.warn} ${title}`).setDescription(description || '');
}

// Composers
export function addBotMetrics(embed, client) {
  const mem = process.memoryUsage();
  embed.addFields(
    { name: `${EMOJI.server} Servers`, value: fmt.num(client.guilds.cache.size), inline: true },
    { name: `${EMOJI.time} Uptime`, value: fmt.uptime(process.uptime() * 1000), inline: true },
    { name: `${EMOJI.memory} RAM`, value: fmt.bytes(mem.rss), inline: true },
  );
  return embed;
}

export function addLatency(embed, message) {
  const ws = message.client?.ws?.ping ?? 0;
  const rt = Math.max(0, Date.now() - message.createdTimestamp);
  embed.addFields(
    { name: `${EMOJI.ping} WS`, value: `${ws} ms`, inline: true },
    { name: `${EMOJI.time} RT`, value: `${rt} ms`, inline: true },
  );
  return embed;
}

export function addServerFields(embed, guild) {
  embed.addFields(
    { name: `${EMOJI.server} Name`, value: safe(guild?.name), inline: true },
    { name: `${EMOJI.user} Members`, value: fmt.num(guild?.memberCount || 0), inline: true },
    { name: `${EMOJI.time} Created`, value: guild?.createdTimestamp ? fmt.ts(guild.createdTimestamp) : 'N/A', inline: true },
  );
  if (guild?.iconURL) embed.setThumbnail(guild.iconURL({ size: 256 }));
  return embed;
}

export function addUserFields(embed, user, member) {
  const roles = member ? member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.toString()).slice(0, 15).join(', ') || 'None' : 'N/A';
  embed.addFields(
    { name: `${EMOJI.user} ID`, value: safe(user?.id), inline: true },
    { name: `${EMOJI.time} Created`, value: user?.createdTimestamp ? fmt.ts(user.createdTimestamp) : 'N/A', inline: true },
    { name: `${EMOJI.roles} Roles`, value: roles, inline: false },
  );
  if (user?.displayAvatarURL) embed.setThumbnail(user.displayAvatarURL({ size: 256 }));
  return embed;
}

export function linkify(text, url) {
  return `[${text}](${url})`;
}

export function withFooterNote(embed, text) {
  const prev = embed.data.footer?.text || '';
  const next = prev ? `${prev} • ${text}` : text;
  embed.setFooter({ ...embed.data.footer, text: next });
  return embed;
}

export { BRAND_COLOR, SECONDARY_COLOR, SUCCESS_COLOR, DANGER_COLOR, WARNING_COLOR, LOGO_URL, BANNER_URL, EMOJI, fmt };
