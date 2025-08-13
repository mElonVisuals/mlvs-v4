export const name = 'ready';
export const once = true;

export function execute(client) {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({ activities: [{ name: `${process.env.PREFIX || '!'}help | ${client.guilds.cache.size} servers` }], status: 'online' });
  // Ensure verify embed exists in the verify channel
  ensureVerifyMessage(client).catch(err => console.error('Verify setup error:', err?.message || err));
}

// Channel / role IDs (could be moved to env later)
const VERIFY_CHANNEL_ID = '1401628230976540702';
const VERIFY_BUTTON_ID = 'verify_btn_primary';

async function ensureVerifyMessage(client){
  const channel = await client.channels.fetch(VERIFY_CHANNEL_ID).catch(()=>null);
  if (!channel || !channel.isTextBased()) return;
  try {
    const messages = await channel.messages.fetch({ limit: 25 }).catch(()=>new Map());
    const existing = [...messages.values()].find(m => m.author.id === client.user.id && m.components?.some(row => row.components?.some(c => c.customId === VERIFY_BUTTON_ID)));
    if (existing) return; // already present
  } catch {}
  const embed = {
    title: 'Server Verification',
    description: 'Welcome! To access the full server, please verify you are human and agree to the rules. Click the button below to continue.',
    color: 0x4ade80,
    footer: { text: 'Verification System' },
    timestamp: new Date().toISOString(),
    fields: [
      { name: 'Why verify?', value: 'Helps keep the community safe from bots and spam.' },
      { name: 'What happens?', value: 'You are granted the Members role and the Unverified role is removed.' },
      { name: 'Privacy', value: 'No extra data is collected — this just assigns roles.' }
    ]
  };
  const components = [
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: 'VERIFY', custom_id: VERIFY_BUTTON_ID, emoji: { name: '✅' } }
      ]
    }
  ];
  await channel.send({ embeds: [embed], components });
}

