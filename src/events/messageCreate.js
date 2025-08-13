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

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error('Command error:', error);
    await message.reply({ content: 'There was an error executing that command.' }).catch(() => {});
  }
}
