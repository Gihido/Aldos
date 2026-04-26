window.RegenModule = (() => {
  let hpTimer = null;
  let energyTimer = null;

  function calculateHpRegen() {
    const p = PlayerModule.getPlayer();
    if (!p) return 0;
    const base = Math.max(1, Math.floor(p.level / 2));
    const bonus = p.equipment?.amulet ? 2 : 0;
    return p.inBattle ? Math.max(1, Math.floor((base + bonus) * 0.35)) : base + bonus;
  }

  function calculateEnergyRegen() {
    const p = PlayerModule.getPlayer();
    if (!p) return 0;
    const base = 3 + Math.floor(p.level / 4);
    const bonus = p.equipment?.ring ? 1 : 0;
    return p.inBattle ? 1 : base + bonus;
  }

  function applyRegenTick(kind) {
    const p = PlayerModule.getPlayer();
    if (!p) return;

    if (kind === 'hp') {
      const hp = calculateHpRegen();
      if (hp > 0) {
        PlayerModule.heal(hp);
        UIManager.animateHeal('top-panel', hp);
      }
    }

    if (kind === 'energy') {
      const en = calculateEnergyRegen();
      if (en > 0) PlayerModule.restoreEnergy(en);
    }

    PlayerModule.renderTopPanel();
    PlayerModule.autosave();
    OnlineModule.savePlayerOnline();
  }

  function startAutoRegen() {
    stopAutoRegen();
    hpTimer = setInterval(() => applyRegenTick('hp'), 10000);
    energyTimer = setInterval(() => applyRegenTick('energy'), 5000);
  }

  function stopAutoRegen() {
    clearInterval(hpTimer);
    clearInterval(energyTimer);
    hpTimer = null;
    energyTimer = null;
  }

  return { startAutoRegen, stopAutoRegen, applyRegenTick, calculateHpRegen, calculateEnergyRegen };
})();
