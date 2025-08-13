// PrimeVue (CDN) bootstrap for dashboard nav + KPI cards
(function(){
  function getJSON(id){ try{ const el=document.getElementById(id); return el?JSON.parse(el.textContent):null; }catch{ return null; } }
  const NAV = getJSON('nav_data')||{};
  const DATA = getJSON('dash_data')||{};

  const { createApp } = window.Vue;
  const PrimeVue = window.primevue.default; // UMD default export

  // Navbar Menubar
  const NavApp = createApp({
    data(){ return { items: [] } },
    created(){
      this.items = [
        { label: 'Home', icon: 'pi pi-home', url: '/' },
        { label: 'Dashboard', icon: 'pi pi-chart-bar', url: '/dashboard' },
        {
          label: 'More', icon: 'pi pi-ellipsis-h', items: [
            { label: 'API', icon: 'pi pi-bolt', url: '/api/status', target: '_blank' },
            ...(NAV.inviteUrl ? [{ label: 'Invite', icon: 'pi pi-discord', url: '/invite' }] : []),
            ...(NAV.supportUrl ? [{ label: 'Support', icon: 'pi pi-comments', url: NAV.supportUrl, target: '_blank' }] : []),
            { label: 'GitHub', icon: 'pi pi-github', url: NAV.githubUrl, target: '_blank' }
          ]
        }
      ];
    },
    template: `
      <p-menubar :model="items" class="p-menubar p-component" :pt="{root:{class:'p-shadow-2 p-px-2 p-py-1'}, menu: {class:'p-menubar-root-list'}}">
        <template #start>
          <!-- brand space already occupied by static logo -->
        </template>
      </p-menubar>
    `
  });
  NavApp.use(PrimeVue);
  NavApp.component('p-menubar', window.primevue.menubar);
  const navMount = document.getElementById('pv-nav');
  if (navMount) NavApp.mount(navMount);

  // KPI Cards
  const CardsApp = createApp({
    data(){ return { d: DATA } },
    computed:{ lastUpdated(){ return this.d.updatedAt ? new Date(this.d.updatedAt).toLocaleString() : '-' } },
    template: `
      <div class="p-grid p-nogutter p-gap-3">
        <div class="p-col-12 p-md-3">
          <p-card><template #title>Servers</template><template #content><div class="p-text-2xl p-font-bold">{{ d.guilds }}</div></template></p-card>
        </div>
        <div class="p-col-12 p-md-3">
          <p-card><template #title>Users</template><template #content><div class="p-text-2xl p-font-bold">{{ d.users }}</div></template></p-card>
        </div>
        <div class="p-col-12 p-md-3">
          <p-card><template #title>Updated</template><template #content><div class="p-text-sm">{{ lastUpdated }}</div></template></p-card>
        </div>
        <div class="p-col-12 p-md-3">
          <p-card><template #title>Health</template><template #content><code>/api/status</code></template></p-card>
        </div>
      </div>
    `
  });
  CardsApp.use(PrimeVue);
  CardsApp.component('p-card', window.primevue.card);
  const cardsMount = document.getElementById('pv-cards');
  if (cardsMount) CardsApp.mount(cardsMount);
})();
