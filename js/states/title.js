// js/states/title.js
const TitleState = {
  enter(data) {
    // Overlays
    this.menu = document.getElementById('titleMenu');
    this.sel  = document.getElementById('selectRunner');
    document.getElementById('avatarForm')?.classList.add('hidden');
    this.sel.classList.add('hidden');
    this.menu.classList.remove('hidden');

    // Title buttons
    this.btnNew    = document.getElementById('btnNew');
    this.btnSelect = document.getElementById('btnSelect');
    this.onNew     = () => Game.setState('avatar');
    this.onSelect  = () => this.openSelect();

    this.btnNew.addEventListener('click', this.onNew);
    this.btnSelect.addEventListener('click', this.onSelect);

    // Keyboard shortcut: Enter/Space = New
    this.onKey = (e) => { if (e.code === 'Enter' || e.code === 'Space') this.onNew(); };
    window.addEventListener('keydown', this.onKey);

    // Optional: open selector immediately
    if (data?.mode === 'select') this.openSelect();
  },

  async openSelect() {
    this.menu.classList.add('hidden');
    this.sel.classList.remove('hidden');

    this.search       = document.getElementById('searchUser');
    this.grid         = document.getElementById('runnerGrid'); // must exist in HTML
    this.btnUse       = document.getElementById('btnUse');
    this.btnCancel    = document.getElementById('btnCancel');
    this.btnCreateNew = document.getElementById('btnCreateNew');

    this.btnUse.disabled = true;
    this.selected = null;

    const badgeText = (avatar_key, username) =>
      avatar_key?.startsWith('runner_')
        ? avatar_key.replace('runner_','').slice(0,1)
        : (username ?? '?').slice(0,1);

    const fmtDate = (iso) => {
      if (!iso) return '—';
      const d = new Date(iso.replace(' ', 'T'));
      const diff = (Date.now() - d.getTime()) / 86400000;
      if (diff < 1) return 'today';
      if (diff < 2) return 'yesterday';
      return d.toLocaleDateString();
    };

    const render = (users = []) => {
      this.grid.innerHTML = '';
      if (users.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'runner-card muted';
        empty.innerHTML = `
          <div class="badge">?</div>
          <div>
            <div class="name">No runners found</div>
            <div class="meta">Try creating a new runner.</div>
          </div>`;
        this.grid.appendChild(empty);
        this.btnUse.disabled = true;
        return;
      }

      for (const u of users) {
        const card = document.createElement('div');
        card.className = 'runner-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'option');

        card.dataset.id = u.id;
        card.dataset.username = u.username;
        card.dataset.avatar = u.avatar_key ?? '';

        const sector = u.current_sector ? `Sector ${u.current_sector}` : 'Sector 1';
        const best   = (u.best_score ?? 0) + ' pts';
        const last   = fmtDate(u.last_played);

        card.innerHTML = `
          <div class="badge">${badgeText(u.avatar_key, u.username)}</div>
          <div>
            <div class="name">${u.username}</div>
            <div class="meta">${u.avatar_key || 'avatar'} • ${sector} • last: ${last}</div>
            <div class="stats-row"><span class="stat">Best: ${best}</span></div>
          </div>
        `;

        card.addEventListener('click', () => this.pick(card));
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.pick(card); });
        this.grid.appendChild(card);
      }
    };

    this.fetchAndRender = async () => {
      const q = (this.search.value || '').trim();
      const res = await API.listUsers(q, 30);
      render(res.ok ? res.users : []);
    };

    this.pick = (node) => {
      this.selected = node;
      Array.from(this.grid.children).forEach(n => n.classList.toggle('selected', n === node));
      this.btnUse.disabled = false;
    };

    this.onUse       = () => {
      if (!this.selected) return;
      localStorage.setItem('user_id', this.selected.dataset.id);
      localStorage.setItem('username', this.selected.dataset.username);
      localStorage.setItem('avatar_key', this.selected.dataset.avatar);
      this.closeSelect();
      Game.setState('story'); // later: resume from checkpoint
    };
    this.onCancel    = () => { this.closeSelect(); this.menu.classList.remove('hidden'); };
    this.onCreateNew = () => { this.closeSelect(); Game.setState('avatar'); };

    this.search.addEventListener('input', this.fetchAndRender);
    this.btnUse.addEventListener('click', this.onUse);
    this.btnCancel.addEventListener('click', this.onCancel);
    this.btnCreateNew.addEventListener('click', this.onCreateNew);

    await this.fetchAndRender();
    this.search.focus();
  },

  closeSelect() {
    this.search?.removeEventListener('input', this.fetchAndRender);
    this.btnUse?.removeEventListener('click', this.onUse);
    this.btnCancel?.removeEventListener('click', this.onCancel);
    this.btnCreateNew?.removeEventListener('click', this.onCreateNew);
    this.sel?.classList.add('hidden');
  },

  exit() {
    window.removeEventListener('keydown', this.onKey);
    this.btnNew?.removeEventListener('click', this.onNew);
    this.btnSelect?.removeEventListener('click', this.onSelect);
    this.closeSelect();
    this.menu?.classList.add('hidden');
  },

  update() {},
  draw(ctx) {}
};
