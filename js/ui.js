window.UIManager = (() => {
  let activeSection = 'location';

  function qs(id) { return document.getElementById(id); }

  function showToast(message, type = 'info') {
    const stack = qs('toastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    stack.append(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 280); }, 2200);
  }

  function showModal(title, content, buttons = []) {
    qs('modalTitle').textContent = title;
    qs('modalBody').innerHTML = content;
    const footer = qs('modalButtons');
    footer.innerHTML = '';
    buttons.forEach((b) => {
      const btn = makeButton(b.label, b.type || 'secondary', b.onClick);
      footer.append(btn);
    });
    qs('globalModal').classList.add('show');
  }

  function closeModal() { qs('globalModal').classList.remove('show'); }

  function makeButton(label, type, onClick, disabled = false) {
    const btn = document.createElement('button');
    btn.className = `btn ${type}`;
    btn.textContent = label;
    btn.disabled = !!disabled;
    btn.onclick = onClick;
    return btn;
  }

  function setScreen(name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    qs(`${name}Screen`)?.classList.add('active');
  }

  function setActiveTab(name) {
    activeSection = name;
    document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
    qs(`${name}Section`)?.classList.add('active');
    document.querySelectorAll('.drawer-item').forEach((d) => d.classList.toggle('active', d.dataset.section === name));
    closeDrawer();
  }

  function openDrawer() { qs('drawer').classList.add('open'); qs('drawerBackdrop').classList.add('show'); }
  function closeDrawer() { qs('drawer').classList.remove('open'); qs('drawerBackdrop').classList.remove('show'); }

  function updateBars() {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    const s = PlayerModule.getComputedStats();
    updateBar('hpBarFill', 'hpBarText', p.hp, s.maxHp);
    updateBar('energyBarFill', 'energyBarText', p.energy, p.maxEnergy);
    updateBar('xpBarFill', 'xpBarText', p.exp, PlayerModule.expToNextLevel());
  }

  function updateBar(fillId, textId, cur, max) {
    const safeMax = Math.max(1, Number(max) || 1);
    const safeCur = Math.max(0, Math.min(safeMax, Number(cur) || 0));
    qs(fillId).style.width = `${(safeCur / safeMax) * 100}%`;
    qs(textId).textContent = `${Math.round(safeCur)} / ${Math.round(safeMax)}`;
  }

  function renderPlayerHeader() {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    qs('headerNick').textContent = p.nickname;
    qs('headerClass').textContent = `${p.className} • Lv.${p.level}`;
    qs('headerGold').textContent = `🪙 ${p.gold}`;
    updateBars();
  }

  function bindDrawer() {
    qs('openDrawerBtn').onclick = openDrawer;
    qs('drawerBackdrop').onclick = closeDrawer;
    document.querySelectorAll('.drawer-item').forEach((item) => {
      item.onclick = () => setActiveTab(item.dataset.section);
    });
  }

  return {
    qs,
    showToast,
    showModal,
    closeModal,
    setScreen,
    setActiveTab,
    updateBars,
    renderPlayerHeader,
    bindDrawer,
    openDrawer,
    closeDrawer,
    makeButton,
    get activeSection() { return activeSection; }
  };
})();
