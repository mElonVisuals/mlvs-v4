export const name = 'interactionCreate';
export const once = false;

const VERIFY_BUTTON_ID = 'verify_btn_primary';
const UNVERIFIED_ROLE_ID = '1401625907482984551';
const MEMBERS_ROLE_ID = '1399901918481879212';

export async function execute(interaction, client){
  try {
    // Slash command support
    if (interaction.isChatInputCommand?.()) {
      const commandName = interaction.commandName;
      const command = client.commands.get(commandName);
      if (!command) return;
      try {
        const started = Date.now();
        await command.execute(interaction, interaction.options?._hoistedOptions || [], client);
        client._emitCommandActivity?.({
          command: commandName,
          user: interaction.user?.tag || interaction.user?.username || interaction.user?.id,
          guild: interaction.guild?.name || 'DM',
          timestamp: Date.now(),
          duration: Date.now() - started,
          status: 'success'
        });
      } catch (err) {
        try { await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true }); } catch {}
        client._emitCommandActivity?.({
          command: commandName,
          user: interaction.user?.tag || interaction.user?.username || interaction.user?.id,
          guild: interaction.guild?.name || 'DM',
          timestamp: Date.now(),
          duration: 0,
          status: 'error'
        });
      }
      return; // don't process buttons if it was a slash command
    }

    // Button verification flow
    if (interaction.isButton()) {
      if (interaction.customId !== VERIFY_BUTTON_ID) return;
      const member = interaction.member;
      if (!member || member.user?.bot) return interaction.reply({ content: 'Unable to verify this entity.', ephemeral: true }).catch(()=>{});
      const hasMember = MEMBERS_ROLE_ID && member.roles.cache.has(MEMBERS_ROLE_ID);
      if (hasMember) return interaction.reply({ content: 'You are already verified.', ephemeral: true }).catch(()=>{});
      if (UNVERIFIED_ROLE_ID && member.roles.cache.has(UNVERIFIED_ROLE_ID)) {
        await member.roles.remove(UNVERIFIED_ROLE_ID).catch(()=>{});
      }
      if (MEMBERS_ROLE_ID) {
        await member.roles.add(MEMBERS_ROLE_ID).catch(()=>{});
      }
      await interaction.reply({ content: '✅ You have been verified! Enjoy the server.', ephemeral: true }).catch(()=>{});
    }
  } catch (e) {
    if (interaction && !interaction.replied) {
      try { await interaction.reply({ content: 'Interaction failed.', ephemeral: true }); } catch {}
    }
  }
}
