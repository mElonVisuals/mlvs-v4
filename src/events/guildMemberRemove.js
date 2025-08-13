export const name = 'guildMemberRemove';
export const once = false;

const GOODBYE_CHANNEL_ID = '1401618792798224434';

export async function execute(member){
  try {
    const channel = await member.guild.channels.fetch(GOODBYE_CHANNEL_ID).catch(()=>null);
    if (channel && channel.isTextBased()){
      const embed = {
        title: 'Goodbye',
        description: `${member.user?.tag || 'A member'} has left the server. We now have **${member.guild.memberCount}** members.`,
        color: 0xef4444,
        timestamp: new Date().toISOString()
      };
      channel.send({ embeds: [embed] }).catch(()=>{});
    }
  } catch {}
}
