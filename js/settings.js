window.SettingsModule = (() => {
  const KEY = 'sok_settings_v2';
  const defaults = {
    volume: 70,
    animations: true,
    vibration: false,
    textSize: 100,
    effectsQuality: 'high',
    theme: 'dark'
  };

  let settings = { ...defaults };

  function saveSettings() {
    localStorage.setItem(KEY, JSON.stringify(settings));
    const p = PlayerModule.getPlayer();
    if (p) {
      p.settings = settings;
      PlayerModule.autosave();
    }
  }

  function loadSettings() {
    try {
      settings = { ...defaults, ...(JSON.parse(localStorage.getItem(KEY) || '{}')) };
    } catch {
      settings = { ...defaults };
    }
    return settings;
  }

  function applySettings() {
    document.body.classList.toggle('theme-light', settings.theme === 'light');
    document.documentElement.style.setProperty('--ui-text-scale', `${settings.textSize}%`);
    document.body.classList.toggle('no-anim', !settings.animations);
  }

  function exportSave() {
    const raw = localStorage.getItem('sok_player_profile_v2') || '{}';
    UIManager.showModal('Экспорт сохранения', `<textarea class="save-box">${raw}</textarea>`, [{ label: 'Закрыть', type: 'secondary', onClick: UIManager.closeModal }]);
  }

  function importSave() {
    const area = UIManager.qs('saveImportText');
    const raw = area?.value?.trim();
    if (!raw) return;
    try {
      JSON.parse(raw);
      localStorage.setItem('sok_player_profile_v2', raw);
      UIManager.showToast('Сохранение импортировано.', 'success');
      location.reload();
    } catch {
      UIManager.showToast('Неверный формат сохранения.', 'error');
    }
  }

  function clearSave() {
    localStorage.removeItem('sok_player_profile_v2');
    UIManager.showToast('Сохранение очищено.', 'warning');
  }

  function bind() {
    loadSettings();
    applySettings();

    UIManager.qs('settingsVolume')?.addEventListener('input', (e) => { settings.volume = Number(e.target.value); saveSettings(); });
    UIManager.qs('settingsAnimations')?.addEventListener('change', (e) => { settings.animations = e.target.checked; saveSettings(); applySettings(); });
    UIManager.qs('settingsVibration')?.addEventListener('change', (e) => { settings.vibration = e.target.checked; saveSettings(); });
    UIManager.qs('settingsTextSize')?.addEventListener('input', (e) => { settings.textSize = Number(e.target.value); saveSettings(); applySettings(); });
    UIManager.qs('settingsQuality')?.addEventListener('change', (e) => { settings.effectsQuality = e.target.value; saveSettings(); });
    UIManager.qs('settingsTheme')?.addEventListener('change', (e) => { settings.theme = e.target.value; saveSettings(); applySettings(); });
    UIManager.qs('clearSaveBtn')?.addEventListener('click', clearSave);
    UIManager.qs('exportSaveBtn')?.addEventListener('click', exportSave);
    UIManager.qs('importSaveBtn')?.addEventListener('click', importSave);

    UIManager.qs('settingsVolume').value = settings.volume;
    UIManager.qs('settingsAnimations').checked = settings.animations;
    UIManager.qs('settingsVibration').checked = settings.vibration;
    UIManager.qs('settingsTextSize').value = settings.textSize;
    UIManager.qs('settingsQuality').value = settings.effectsQuality;
    UIManager.qs('settingsTheme').value = settings.theme;
  }

  return { saveSettings, loadSettings, applySettings, exportSave, importSave, bind };
})();
