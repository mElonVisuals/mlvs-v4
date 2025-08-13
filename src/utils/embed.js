import { EmbedBuilder } from 'discord.js';

// ========= THEME DEFINITIONS =========
// Single source of truth for colors & assets so the whole bot can shift style quickly.
// Use env overrides for production branding while providing tasteful defaults.
const BRAND_COLOR = Number(process.env.BRAND_COLOR) || 0x5865F2; // primary accent
const BRAND_COLOR_ALT = Number(process.env.BRAND_COLOR_ALT) || 0x8B5CF6; // secondary accent for gradients (conceptual)
const NEUTRAL = Number(process.env.EMBED_NEUTRAL_COLOR) || 0x2F3136;
const POSITIVE = Number(process.env.EMBED_POSITIVE_COLOR) || 0x3BA55D;
const NEGATIVE = Number(process.env.EMBED_NEGATIVE_COLOR) || 0xED4245;
const WARNING = Number(process.env.EMBED_WARNING_COLOR) || 0xFAA61A;

const LOGO_URL = process.env.LOGO_URL || 'https://cdn.discordapp.com/attachments/1335734480253747297/1402442222816989346/logoglow.png?';
const BANNER_URL = process.env.BANNER_URL || 'https://cdn.discordapp.com/attachments/1335734480253747297/1402473578254962808/banner3.png?';

// ========= UTILITIES =========
// Safe formatting utilities & exported helpers used across commands.

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
  const name = client?.user?.username || process.env.BRAND_NAME || 'Bot';
  const iconURL = client?.user?.displayAvatarURL?.() || LOGO_URL;
  return { name, iconURL };
}

// Base embed – minimal glassmorphism inspired style (we can't do true blur in Discord, so we keep color minimal)
// By default we hide the large banner for a cleaner, modern look; individual commands can opt-in.
export function baseEmbed(messageOrClient, opts = {}) {
  const client = messageOrClient?.client || messageOrClient;
  const color = opts.color ?? BRAND_COLOR;
  const showBanner = opts.banner ?? false; // switched default to false (cleaner)
  const footerNote = opts.footerNote;
  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor(computeAuthor(client))
    .setThumbnail(opts.thumbnail || LOGO_URL)
    .setTimestamp(Date.now());
  if (showBanner) embed.setImage(BANNER_URL);
  if (footerNote) embed.setFooter({ text: footerNote, iconURL: computeAuthor(client).iconURL });
  else embed.setFooter({ text: computeAuthor(client).name, iconURL: computeAuthor(client).iconURL });
  return embed;
}

export function sectionedEmbed(ctx, title, description, fields = [], opts = {}) {
  const embed = baseEmbed(ctx, opts).setTitle(title);
  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(...fields);
  return embed;
}

// Convenience typed embeds with iconography prefix for stronger glance parsing
export function successEmbed(ctx, title, description, fields = []) {
  return sectionedEmbed(ctx, `✅ ${title}`, description, fields, { color: POSITIVE });
}
export function errorEmbed(ctx, title, description, fields = []) {
  return sectionedEmbed(ctx, `❌ ${title}`, description, fields, { color: NEGATIVE });
}
export function infoEmbed(ctx, title, description, fields = []) {
  return sectionedEmbed(ctx, `ℹ️ ${title}`, description, fields, { color: BRAND_COLOR });
}
export function warnEmbed(ctx, title, description, fields = []) {
  return sectionedEmbed(ctx, `⚠️ ${title}`, description, fields, { color: WARNING });
}

// Command usage block builder
export function usageBlock(prefix, usage){
  return `Usage:\n\`${prefix}${usage}\``;
}

export function commandEmbed(ctx, cmd, opts = {}){
  const prefix = process.env.PREFIX || '!';
  const e = baseEmbed(ctx, opts).setTitle(cmd.icon ? `${cmd.icon} ${cmd.name}` : cmd.name);
  if (cmd.description) e.setDescription(`${cmd.description}\n\n${usageBlock(prefix, cmd.usage || cmd.name)}`);
  if (opts.extraFields?.length) e.addFields(...opts.extraFields);
  return e;
}

// Composers
export function addBotMetrics(embed, client) {
  const mem = process.memoryUsage();
  embed.addFields(
    { name: 'Servers', value: fmt.num(client.guilds.cache.size), inline: true },
    { name: 'Uptime', value: fmt.uptime(process.uptime() * 1000), inline: true },
    { name: 'RAM', value: fmt.bytes(mem.rss), inline: true },
  );
  return embed;
}

export function addLatency(embed, message) {
  const ws = message.client?.ws?.ping ?? 0;
  const rt = Math.max(0, Date.now() - message.createdTimestamp);
  embed.addFields(
    { name: 'WS Ping', value: `${ws} ms`, inline: true },
    { name: 'Response Time', value: `${rt} ms`, inline: true },
  );
  return embed;
}

export function addServerFields(embed, guild) {
  embed.addFields(
    { name: 'Name', value: safe(guild?.name), inline: true },
    { name: 'Members', value: fmt.num(guild?.memberCount || 0), inline: true },
    { name: 'Created', value: guild?.createdTimestamp ? fmt.ts(guild.createdTimestamp) : 'N/A', inline: true },
  );
  if (guild?.iconURL) embed.setThumbnail(guild.iconURL({ size: 256 }));
  return embed;
}

export function addUserFields(embed, user, member) {
  const roles = member ? member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.toString()).slice(0, 15).join(', ') || 'None' : 'N/A';
  embed.addFields(
    { name: 'ID', value: safe(user?.id), inline: true },
    { name: 'Created', value: user?.createdTimestamp ? fmt.ts(user.createdTimestamp) : 'N/A', inline: true },
    { name: 'Roles', value: roles, inline: false },
  );
  if (user?.displayAvatarURL) embed.setThumbnail(user.displayAvatarURL({ size: 256 }));
  return embed;
}

export function linkify(text, url) { return `[${text}](${url})`; }

export function withFooterNote(embed, text) {
  const prev = embed.data.footer?.text || '';
  const next = prev ? `${prev} • ${text}` : text;
  embed.setFooter({ ...embed.data.footer, text: next });
  return embed;
}

export { BRAND_COLOR, BRAND_COLOR_ALT, NEUTRAL as SECONDARY_COLOR, POSITIVE as SUCCESS_COLOR, NEGATIVE as DANGER_COLOR, WARNING as WARNING_COLOR, LOGO_URL, BANNER_URL, fmt };
