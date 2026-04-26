window.SettingsModule = (() => {
  function apply() {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    document.documentElement.style.setProperty('--text-scale', `${p.textScale || 100}%`);
    document.body.classList.toggle('no-anim', !p.animationsEnabled);
    UIManager.qs('settingsNick').textContent = p.name;
    UIManager.qs('settingsFriendCode').textContent = p.friendCode;
    UIManager.qs('settingsTextScale').value = p.textScale;
    UIManager.qs('settingsAnim').checked = p.animationsEnabled;
  }

  function bind() {
    UIManager.qs('settingsTextScale').oninput = (e) => {
      const p = PlayerModule.getPlayer();
      p.textScale = Number(e.target.value);
      PlayerModule.savePlayer();
      apply();
    };

    UIManager.qs('settingsAnim').onchange = (e) => {
      const p = PlayerModule.getPlayer();
      p.animationsEnabled = e.target.checked;
      PlayerModule.savePlayer();
      apply();
    };

    UIManager.qs('copyFriendCodeBtn').onclick = FriendsModule.copyFriendCode;
    UIManager.qs('resetSaveBtn').onclick = () => { localStorage.removeItem('sok_player_v4'); UIManager.showToast('Сохранение удалено.', 'warning'); location.reload(); };
    UIManager.qs('exportSaveBtn').onclick = () => UIManager.qs('saveDataBox').value = localStorage.getItem('sok_player_v4') || '{}';
    UIManager.qs('importSaveBtn').onclick = () => {
      try {
        JSON.parse(UIManager.qs('saveDataBox').value);
        localStorage.setItem('sok_player_v4', UIManager.qs('saveDataBox').value);
        UIManager.showToast('Импорт выполнен.', 'success');
        location.reload();
      } catch {
        UIManager.showToast('Невалидный JSON.', 'error');
      }
    };
  }

  return { bind, apply };
})();
