export const name = 'ready';
export const once = true;

export function execute(client) {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({ activities: [{ name: `${process.env.PREFIX || '!'}help | ${client.guilds.cache.size} servers` }], status: 'online' });
}
