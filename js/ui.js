window.UIManager = (() => {
  const state = { activeScreen: 'loadingScreen', activeTab: 'locationTab' };

  function qs(id) { return document.getElementById(id); }
  function safeSetText(id, value) { const el = qs(id); if (el) el.textContent = value; }

  function hideAllScreens() {
    document.querySelectorAll('.screen').forEach((x) => x.classList.remove('active'));
  }

  function showScreen(screenName) {
    hideAllScreens();
    qs(screenName)?.classList.add('active');
    state.activeScreen = screenName;
  }

  function setScreen(screenName) {
    if (screenName.endsWith('Tab')) {
      setActiveTab(screenName.replace('Tab', ''));
      return;
    }
    showScreen(screenName);
  }

  function setActiveTab(tabName) {
    const full = tabName.endsWith('Tab') ? tabName : `${tabName}Tab`;
    document.querySelectorAll('.tab-screen').forEach((x) => x.classList.remove('active'));
    qs(full)?.classList.add('active');
    state.activeTab = full;

    document.querySelectorAll('.bottom-nav button').forEach((btn) => {
      btn.classList.toggle('active', `${btn.dataset.tab}Tab` === full);
    });
  }

  function showToast(message, type = 'info') {
    const stack = qs('toastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    stack.append(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  function showModal(title, content, buttons = []) {
    const modal = qs('genericModal');
    if (!modal) return;
    safeSetText('genericModalTitle', title);
    qs('genericModalBody').innerHTML = content;
    const footer = qs('genericModalFooter');
    footer.innerHTML = '';

    buttons.forEach((btn) => footer.append(makeButton(btn.label, btn.type || 'secondary', btn.onClick)));
    modal.classList.add('show');
  }

  function closeModal() {
    qs('genericModal')?.classList.remove('show');
  }

  function makeButton(label, type, onClick, disabled = false) {
    const btn = document.createElement('button');
    btn.className = `btn ${type}`;
    btn.textContent = label;
    btn.disabled = disabled;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function animateDamage(targetId, amount, isCrit = false) {
    const target = typeof targetId === 'string' ? (qs(targetId) || document.querySelector(`.${targetId}`)) : targetId;
    if (!target) return;

    target.classList.add(isCrit ? 'criticalFlash' : 'hitShake');
    const txt = document.createElement('div');
    txt.className = `damage-float ${isCrit ? 'crit' : ''}`;
    txt.textContent = `-${amount}`;
    target.append(txt);
    setTimeout(() => { target.classList.remove('criticalFlash', 'hitShake'); txt.remove(); }, 750);
  }

  function animateHeal(targetId, amount) {
    const target = typeof targetId === 'string' ? (qs(targetId) || document.querySelector(`.${targetId}`)) : targetId;
    if (!target) return;
    target.classList.add('healPulse');
    const txt = document.createElement('div');
    txt.className = 'damage-float heal';
    txt.textContent = `+${amount}`;
    target.append(txt);
    setTimeout(() => { target.classList.remove('healPulse'); txt.remove(); }, 750);
  }

  function showLootPopup(rewards) {
    const lines = [
      `<p>🪙 Золото: ${rewards.gold || 0}</p>`,
      `<p>⭐ Опыт: ${rewards.exp || 0}</p>`,
      `<p>🎁 Предметы: ${(rewards.items || []).join(', ') || 'нет'}</p>`
    ].join('');

    showModal('Добыча', lines, [{ label: 'Забрать', type: 'gold', onClick: closeModal }]);
    showToast('Добыча получена!', 'loot');
  }

  function showLevelUpPopup() {
    showModal('Уровень повышен!', '<p class="levelup">Новые силы наполняют героя.</p>', [{ label: 'Продолжить', type: 'gold', onClick: closeModal }]);
  }

  function updateBars() {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    const stats = PlayerModule.getComputedStats();

    updateProgress('hpFill', 'hpLabel', p.hp, stats.maxHp);
    updateProgress('energyFill', 'energyLabel', p.energy, p.maxEnergy);
    updateProgress('xpFill', 'xpLabel', p.exp, PlayerModule.expToNextLevel());
  }

  function updateProgress(fillId, labelId, cur, max) {
    const fill = qs(fillId);
    const safeMax = Math.max(1, Number(max) || 1);
    const safeCur = Math.max(0, Math.min(safeMax, Number(cur) || 0));
    if (fill) fill.style.width = `${(safeCur / safeMax) * 100}%`;
    safeSetText(labelId, `${Math.round(safeCur)} / ${Math.round(safeMax)}`);
  }

  function renderPlayerHeader() {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    safeSetText('topNick', p.nickname);
    safeSetText('topClassLevel', `${p.className} • Lv.${p.level}`);
    safeSetText('topGold', `🪙 ${p.gold}`);
    updateBars();
  }

  return {
    state,
    qs,
    safeSetText,
    showToast,
    showModal,
    closeModal,
    setScreen,
    setActiveTab,
    animateDamage,
    animateHeal,
    showLootPopup,
    showLevelUpPopup,
    updateBars,
    renderPlayerHeader,
    makeButton,
    showScreen
  };
})();
