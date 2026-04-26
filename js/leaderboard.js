window.LeaderboardModule = (() => {
  let mode = 'level';

  function rows() {
    return LocalServer.getOnlinePlayers().map((p) => {
      const local = p.playerId === PlayerModule.getPlayer().playerId ? PlayerModule.getPlayer() : null;
      return {
        nickname: p.nickname,
        level: local?.level ?? p.level,
        gold: local?.gold ?? 0,
        wins: local?.wins ?? 0
      };
    });
  }

  function renderLeaderboard(type = mode) {
    mode = type;
    const box = UIManager.qs('leaderboardList');
    box.innerHTML = '';
    const list = rows();
    list.sort((a, b) => (b[type] || 0) - (a[type] || 0));
    if (!list.length) {
      box.innerHTML = '<li>Рейтинг пока пуст.</li>';
      return;
    }
    list.forEach((r, i) => {
      const li = document.createElement('li');
      li.textContent = `#${i + 1} ${r.nickname} — ${type === 'level' ? `Lv.${r.level}` : type === 'gold' ? `${r.gold} 🪙` : `${r.wins} побед`}`;
      box.append(li);
    });
  }

  function bind() {
    document.querySelectorAll('[data-rating]').forEach((btn) => {
      btn.onclick = () => renderLeaderboard(btn.dataset.rating);
    });
    LocalServer.listenServerUpdate(() => renderLeaderboard(mode));
  }

  return { renderLeaderboard, bind };
})();
