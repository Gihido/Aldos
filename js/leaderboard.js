window.LeaderboardModule = (() => {
  const state = { current: 'level', rows: [] };

  async function updateLeaderboard() {
    const players = Object.values((await ServerAPI.get('playersOnline', {})) || {});
    const local = window.FirebaseConfig?.USE_FIREBASE ? players : [...players, ...mockPlayers()];

    state.rows = local.map((p) => ({
      nickname: p.nickname,
      level: p.level || 1,
      gold: p.gold || (p.level || 1) * 100,
      wins: p.wins || Math.floor((p.level || 1) * 1.7),
      power: (p.level || 1) * 100 + (p.gold || 0),
      clan: p.clanId || '—',
      rareItems: p.rareItems || Math.floor((p.level || 1) / 2)
    }));

    await ServerAPI.set('leaderboards', state.rows);
    renderLeaderboard(state.current);
  }

  function mockPlayers() {
    return [
      { nickname: 'Мрак', level: 10, gold: 1500, wins: 22, clanId: 'npc_clan' },
      { nickname: 'Эхо', level: 8, gold: 900, wins: 17, clanId: '—' },
      { nickname: 'Клык', level: 7, gold: 760, wins: 13, clanId: 'wolf' }
    ];
  }

  function sortBy(type) {
    const map = { level: 'level', gold: 'gold', wins: 'wins', power: 'power', clan: 'clan', rare: 'rareItems' };
    const key = map[type] || 'level';
    return [...state.rows].sort((a, b) => (typeof a[key] === 'string' ? String(a[key]).localeCompare(String(b[key])) : b[key] - a[key]));
  }

  function renderLeaderboard(type = 'level') {
    state.current = type;
    const box = UIManager.qs('leaderboardBox');
    if (!box) return;

    box.innerHTML = '';
    sortBy(type).slice(0, 50).forEach((r, idx) => {
      const row = document.createElement('div');
      row.className = 'list-row';
      row.innerHTML = `<span>#${idx + 1} ${r.nickname}</span><strong>${valueForType(r, type)}</strong>`;
      box.append(row);
    });
  }

  function valueForType(row, type) {
    if (type === 'gold') return `${row.gold} 🪙`;
    if (type === 'wins') return `${row.wins} побед`;
    if (type === 'power') return `${row.power} силы`;
    if (type === 'clan') return row.clan;
    if (type === 'rare') return `${row.rareItems} редких`;
    return `Lv.${row.level}`;
  }

  function listenLeaderboard() {
    return ServerAPI.listen('leaderboards', (rows) => {
      if (Array.isArray(rows)) state.rows = rows;
      renderLeaderboard(state.current);
    });
  }

  function bind() {
    document.querySelectorAll('[data-lb]').forEach((btn) => {
      btn.addEventListener('click', () => renderLeaderboard(btn.dataset.lb));
    });
  }

  return { updateLeaderboard, listenLeaderboard, renderLeaderboard, bind };
})();
