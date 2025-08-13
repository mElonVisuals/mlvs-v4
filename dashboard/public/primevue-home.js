// PrimeVue (CDN) bootstrap for homepage command explorer with Toast & ConfirmDialog
(function(){
  function getJSON(id){ try{ const el=document.getElementById(id); return el?JSON.parse(el.textContent):null; }catch{ return null; } }
  const CMDS = getJSON('cmds_data')||{};
  const NAV = getJSON('nav_data')||{};

  const { createApp, computed, ref } = window.Vue;
  const PrimeVue = window.primevue.default; // UMD default export

  const Explorer = {
    setup(){
      const raw = CMDS; // { cat: [ {name, description, usage} ] }
      const categories = Object.keys(raw);
      const search = ref('');
      const activeCats = ref([]); // multi-select chips

      const flat = Object.entries(raw).flatMap(([cat, arr]) => (arr||[]).map(x => ({...x, cat})));
      const list = computed(() => {
        const q = search.value.trim().toLowerCase();
        return flat.filter(item => {
          const matchesText = !q || item.name.toLowerCase().includes(q) || (item.description||'').toLowerCase().includes(q);
          const matchesCat = !activeCats.value.length || activeCats.value.includes(item.cat);
          return matchesText && matchesCat;
        });
      });

      const toast = window.appToast;
      const confirm = window.appConfirm;

      function copyUsage(u){
        if (!u) return;
        navigator.clipboard.writeText(u).then(() => {
          toast.add({ severity: 'success', summary: 'Copied', detail: `Usage copied: ${u}`, life: 1800 });
        }).catch(() => {
          toast.add({ severity: 'warn', summary: 'Clipboard blocked', detail: 'Could not copy to clipboard', life: 1800 });
        });
      }

      function confirmInvite(){
        if (!NAV.inviteUrl) return;
        confirm.require({
          message: 'Invite the bot to your server?',
          header: 'Invite',
          icon: 'pi pi-discord',
          acceptIcon: 'pi pi-check',
          rejectIcon: 'pi pi-times',
          acceptClass: 'p-button-success',
          accept: () => { window.location.href = '/invite'; },
        });
      }

      return { categories, search, activeCats, list, copyUsage, confirmInvite };
    },
    template: `
      <div class="p-fluid">
        <div class="p-d-flex p-ai-center p-jc-between p-flex-wrap p-gap-2 p-mb-2">
          <span class="p-input-icon-left" style="min-width:260px">
            <i class="pi pi-search" />
            <p-inputtext v-model="search" placeholder="Search commands..." />
          </span>
          <div class="p-d-flex p-flex-wrap p-gap-2">
            <p-chip v-for="cat in categories" :key="cat" :label="cat" :removable="false" :class="{'p-highlight': activeCats.includes(cat)}" @click="() => {
              const i = activeCats.indexOf(cat); if (i>-1) activeCats.splice(i,1); else activeCats.push(cat);
            }" />
          </div>
        </div>

        <div class="p-grid p-nogutter p-gap-3">
          <div v-for="item in list" :key="item.cat + ':' + item.name" class="p-col-12 p-md-4">
            <p-card>
              <template #title><code>{{ item.name }}</code></template>
              <template #content>
                <div class="p-mb-2" v-if="item.description">{{ item.description }}</div>
                <div>Usage: <code>{{ item.usage }}</code></div>
              </template>
              <template #footer>
                <p-button label="Copy Usage" icon="pi pi-copy" @click="copyUsage(item.usage)" />
              </template>
            </p-card>
          </div>
        </div>

        <div class="p-d-flex p-jc-end p-mt-3" v-if="NAV.inviteUrl">
          <p-button label="Invite" icon="pi pi-plus" class="p-button-success" @click="confirmInvite" />
        </div>
      </div>
    `
  };

  const App = createApp({ components: { Explorer } });
  App.use(PrimeVue);
  App.use(window.primevue.toastservice);
  App.use(window.primevue.confirmationservice);
  App.component('p-inputtext', window.primevue.inputtext);
  App.component('p-chip', window.primevue.chip); // single Chip used as a tag-like toggle
  App.component('p-card', window.primevue.card);
  App.component('p-button', window.primevue.button);
  App.component('p-toast', window.primevue.toast);
  App.component('p-confirmdialog', window.primevue.confirmdialog);

  // Global refs for toasts/confirm
  App.mount(document.createElement('div')); // temporary mount to get instances
  const toastApp = createApp({ template: '<p-toast />' }); toastApp.use(PrimeVue); toastApp.use(window.primevue.toastservice); const t = toastApp.mount(document.createElement('div'));
  document.body.appendChild(t.$el); window.appToast = t.$toast;
  const confirmApp = createApp({ template: '<p-confirmdialog />' }); confirmApp.use(PrimeVue); confirmApp.use(window.primevue.confirmationservice); const c = confirmApp.mount(document.createElement('div'));
  document.body.appendChild(c.$el); window.appConfirm = c.$confirm;

  // Explorer mount
  const mount = document.getElementById('pv-explorer');
  if (mount) createApp(Explorer).use(PrimeVue).mount(mount);
})();
