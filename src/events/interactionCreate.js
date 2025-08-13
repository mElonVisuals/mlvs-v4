export const name = 'interactionCreate';
export const once = false;

const VERIFY_BUTTON_ID = 'verify_btn_primary';
const UNVERIFIED_ROLE_ID = '1401625907482984551';
const MEMBERS_ROLE_ID = '1399901918481879212';

export async function execute(interaction){
  try {
    if (!interaction.isButton()) return;
    if (interaction.customId !== VERIFY_BUTTON_ID) return;
    const member = interaction.member;
    if (!member || member.user?.bot) return interaction.reply({ content: 'Unable to verify this entity.', ephemeral: true }).catch(()=>{});
    const hasMember = MEMBERS_ROLE_ID && member.roles.cache.has(MEMBERS_ROLE_ID);
    if (hasMember) return interaction.reply({ content: 'You are already verified.', ephemeral: true }).catch(()=>{});
    // Remove unverified role if present
    if (UNVERIFIED_ROLE_ID && member.roles.cache.has(UNVERIFIED_ROLE_ID)) {
      await member.roles.remove(UNVERIFIED_ROLE_ID).catch(()=>{});
    }
    // Add members role
    if (MEMBERS_ROLE_ID) {
      await member.roles.add(MEMBERS_ROLE_ID).catch(()=>{});
    }
    await interaction.reply({ content: '✅ You have been verified! Enjoy the server.', ephemeral: true }).catch(()=>{});
  } catch (e) {
    try { await interaction.reply({ content: 'Verification failed, please contact staff.', ephemeral: true }); } catch {}
  }
}
