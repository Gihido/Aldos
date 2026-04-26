window.InventoryModule = (() => {
  const rareSet = new Set(['rare', 'epic', 'legendary', 'mythic']);

  function ensure() {
    const p = PlayerModule.getPlayer();
    if (!p.inventory) p.inventory = [];
    return p.inventory;
  }

  function addItem(itemId) {
    const item = GameData.ITEMS[itemId];
    if (!item) return false;
    ensure().push(itemId);
    if (rareSet.has(item.rarity)) PlayerModule.getPlayer().stats.rareItems += 1;
    PlayerModule.autosave();
    UIManager.showToast(`Получен предмет: ${item.name}`, 'loot');
    renderInventory();
    return true;
  }

  function equip(index) {
    const p = PlayerModule.getPlayer();
    const inv = ensure();
    const item = GameData.ITEMS[inv[index]];
    if (!item) return;
    const slot = ['weapon', 'armor', 'amulet', 'ring'].includes(item.type) ? item.type : null;
    if (!slot) return;

    const prev = p.equipment[slot];
    p.equipment[slot] = inv[index];
    inv.splice(index, 1);
    if (prev) inv.push(prev);
    PlayerModule.autosave();
    PlayerModule.renderTopPanel();
    CharacterModule.renderCharacterScreen();
    renderInventory();
  }

  function usePotion(index) {
    const inv = ensure();
    const item = GameData.ITEMS[inv[index]];
    if (!item || item.type !== 'potion') return;
    if (item.heal) PlayerModule.heal(item.heal);
    if (item.restoreEnergy) PlayerModule.restoreEnergy(item.restoreEnergy);
    inv.splice(index, 1);
    PlayerModule.autosave();
    PlayerModule.renderTopPanel();
    renderInventory();
  }

  function sell(index) {
    const inv = ensure();
    const item = GameData.ITEMS[inv[index]];
    if (!item) return;
    inv.splice(index, 1);
    PlayerModule.changeGold(Math.max(1, Math.round((item.price || 10) * 0.55)));
    PlayerModule.renderTopPanel();
    PlayerModule.autosave();
    renderInventory();
    ShopModule.renderShop();
  }

  function pass(item, filter) {
    if (filter === 'all') return true;
    if (filter === 'rare') return rareSet.has(item.rarity);
    return item.type === filter;
  }

  function renderInventory(filter = InventoryModule.filter) {
    InventoryModule.filter = filter;
    const box = UIManager.qs('inventoryList');
    const empty = UIManager.qs('inventoryEmpty');
    box.innerHTML = '';

    const rows = ensure().map((id, idx) => ({ idx, item: GameData.ITEMS[id], id })).filter((x) => x.item && pass(x.item, filter));
    if (!rows.length) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    rows.forEach((r) => {
      const card = document.createElement('article');
      card.className = `item-card rarity-${r.item.rarity}`;
      card.innerHTML = `<div class="item-head"><h4>${r.item.icon} ${r.item.name}</h4><span class="rarity-chip ${r.item.rarity}">${r.item.rarity}</span></div><p>${r.item.type}</p>`;
      const actions = document.createElement('div');
      actions.className = 'item-actions';
      if (r.item.type === 'potion') actions.append(UIManager.makeButton('Использовать', 'primary', () => usePotion(r.idx)));
      if (['weapon', 'armor', 'amulet', 'ring'].includes(r.item.type)) actions.append(UIManager.makeButton('Экипировать', 'gold', () => equip(r.idx)));
      actions.append(UIManager.makeButton('Продать', 'secondary', () => sell(r.idx)));
      card.append(actions);
      box.append(card);
    });
  }

  function bind() {
    document.querySelectorAll('[data-inv-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-inv-filter]').forEach((x) => x.classList.remove('active'));
        btn.classList.add('active');
        renderInventory(btn.dataset.invFilter);
      });
    });
  }

  const InventoryModule = { filter: 'all', addItem, renderInventory, bind };
  return InventoryModule;
})();
