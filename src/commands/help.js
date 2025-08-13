export const data = { name: 'help' };

export async function execute(message, args, client) {
  const embed = {
    color: 0x5865F2,
    title: 'Help Menu',
    description: 'Here are the available commands:',
    fields: Array.from(client.commands.values()).map(cmd => ({
      name: `${cmd.data.name}`,
      value: cmd.data.description || 'No description',
      inline: true
    })),
    footer: { text: 'Discord.js Bot', icon_url: message.client.user.displayAvatarURL() },
    timestamp: new Date().toISOString()
  };
  await message.channel.send({ embeds: [embed] });
}
