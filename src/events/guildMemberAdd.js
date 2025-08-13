export const name = 'guildMemberAdd';
export const once = false;

// IDs provided by user
const WELCOME_CHANNEL_ID = '1401618741157953656';
const UNVERIFIED_ROLE_ID = '1401625907482984551';

export async function execute(member, client){
  // Assign Unverified role (ignore bots)
  try {
    if (!member.user.bot && UNVERIFIED_ROLE_ID) {
      await member.roles.add(UNVERIFIED_ROLE_ID).catch(()=>{});
    }
  } catch {}
  // Send welcome message
  try {
    const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(()=>null);
    if (channel && channel.isTextBased()){
      const embed = {
        title: 'Welcome!',
        description: `Hey ${member}, welcome to **${member.guild.name}**! Head over to <#1401628230976540702> to get verified.`,
        color: 0x3b82f6,
        footer: { text: `Member #${member.guild.memberCount}` },
        timestamp: new Date().toISOString()
      };
      channel.send({ embeds: [embed] }).catch(()=>{});
    }
  } catch {}
}
