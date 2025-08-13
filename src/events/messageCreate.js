export const name = 'messageCreate';
export const once = false;

export async function execute(message, client) {
  const prefix = process.env.PREFIX || '!';
  if (!message.content?.startsWith(prefix) || message.author?.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = client.commands.get(commandName);
  if (!command) return;

  // Cooldowns: per-user per-command
  const now = Date.now();
  const key = `${message.author.id}:${command.name}`;
  const cd = client.cooldowns?.get(key) || 0;
  const cooldownMs = command.cooldownMs || Number(process.env.DEFAULT_COOLDOWN_MS||2000);
  const isAdmin = message.member?.permissions?.has?.('Administrator') || false;
  if (!isAdmin && cd && now < cd) {
    const left = Math.ceil((cd - now)/1000);
    return message.reply({ content: `⏳ Slow down — try again in ${left}s` }).catch(()=>{});
  }

  try {
    await command.execute(message, args, client);
    if (!isAdmin) client.cooldowns?.set(key, now + cooldownMs);
  } catch (error) {
    console.error('Command error:', error);
    await message.reply({ content: 'There was an error executing that command.' }).catch(() => {});
  }
}
