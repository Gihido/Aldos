window.UIManager = (() => {
  const state = {
    activeScreen: 'loadingScreen',
    activeTab: 'location',
    screenIds: ['loadingScreen', 'menuScreen', 'authScreen', 'characterCreateScreen', 'gameScreen']
  };

  function qs(id) {
    return document.getElementById(id);
  }

  function safeSetText(id, value) {
    const el = qs(id);
    if (el) el.textContent = value;
  }

  function hideAllScreens() {
    state.screenIds.forEach((id) => qs(id)?.classList.remove('active'));
  }

  function showScreen(screenName) {
    hideAllScreens();
    qs(screenName)?.classList.add('active');
    state.activeScreen = screenName;
  }

  function setActiveTab(tabName) {
    state.activeTab = tabName;
    document.querySelectorAll('.tab-screen').forEach((el) => el.classList.remove('active'));
    qs(`${tabName}Tab`)?.classList.add('active');

    document.querySelectorAll('.bottom-nav button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
  }

  function openModal(id) {
    qs(id)?.classList.add('show');
  }

  function closeModal(id) {
    qs(id)?.classList.remove('show');
  }

  function updateProgressBar(fillId, labelId, current, max) {
    const safeMax = Math.max(1, Number(max) || 1);
    const safeCur = Math.max(0, Math.min(safeMax, Number(current) || 0));
    const percent = Math.max(0, Math.min(100, (safeCur / safeMax) * 100));

    const fill = qs(fillId);
    if (fill) fill.style.width = `${percent}%`;
    safeSetText(labelId, `${Math.round(safeCur)} / ${Math.round(safeMax)}`);
  }

  function showToast(message, type = 'info') {
    const stack = qs('toastStack');
    if (!stack) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    stack.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 20);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 350);
    }, 2800);
  }

  function makeButton(label, type, onClick, disabled = false) {
    const btn = document.createElement('button');
    btn.className = `btn ${type}`;
    btn.textContent = label;
    btn.disabled = !!disabled;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function pushEvent(text) {
    const list = qs('eventLog');
    if (!list) return;
    const li = document.createElement('li');
    li.textContent = `${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}: ${text}`;
    list.prepend(li);
  }

  return {
    state,
    qs,
    safeSetText,
    hideAllScreens,
    showScreen,
    setActiveTab,
    openModal,
    closeModal,
    updateProgressBar,
    showToast,
    makeButton,
    pushEvent
  };
})();
