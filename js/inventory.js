window.InventoryModule = (() => {
  const RARITY_CLASS = {
    common: 'rarity-common',
    rare: 'rarity-rare',
    epic: 'rarity-epic',
    legendary: 'rarity-legendary'
  };

  function ensureInventory() {
    const p = PlayerModule.getPlayer();
    if (!p) return [];
    if (!Array.isArray(p.inventory)) p.inventory = [];
    return p.inventory;
  }

  function addItem(itemId) {
    const item = GameData.ITEMS[itemId];
    if (!item) return false;
    const inv = ensureInventory();
    inv.push(itemId);
    PlayerModule.autosave();
    UIManager.showToast(`Получен предмет: ${item.name}`, 'loot');
    renderInventory();
    return true;
  }

  function removeByIndex(index) {
    const inv = ensureInventory();
    if (index < 0 || index >= inv.length) return null;
    const [removed] = inv.splice(index, 1);
    PlayerModule.autosave();
    return removed;
  }

  function getSlotByType(type) {
    if (type === 'weapon') return 'weapon';
    if (type === 'armor') return 'armor';
    if (type === 'amulet') return 'amulet';
    if (type === 'ring') return 'ring';
    return null;
  }

  function equip(index) {
    const p = PlayerModule.getPlayer();
    if (!p) return;
    const itemId = ensureInventory()[index];
    const item = GameData.ITEMS[itemId];
    if (!item) return;

    const slot = getSlotByType(item.type);
    if (!slot) return;

    const current = p.equipment[slot];
    p.equipment[slot] = itemId;
    removeByIndex(index);
    if (current) p.inventory.push(current);

    PlayerModule.autosave();
    PlayerModule.renderTopPanel();
    CharacterModule.renderCharacterScreen();
    renderInventory();
    UIManager.showToast(`Экипировано: ${item.name}`, 'success');
  }

  function usePotion(index) {
    const itemId = ensureInventory()[index];
    const item = GameData.ITEMS[itemId];
    if (!item || item.type !== 'potion') return;

    if (item.heal) {
      PlayerModule.heal(item.heal);
      UIManager.showToast(`Восстановлено ${item.heal} HP`, 'success');
    }
    if (item.restoreEnergy) {
      PlayerModule.restoreEnergy(item.restoreEnergy);
      UIManager.showToast(`Восстановлено ${item.restoreEnergy} энергии`, 'info');
    }

    removeByIndex(index);
    PlayerModule.renderTopPanel();
    CharacterModule.renderCharacterScreen();
    renderInventory();
  }

  function sell(index) {
    const inv = ensureInventory();
    const itemId = inv[index];
    const item = GameData.ITEMS[itemId];
    if (!item) return;
    const income = Math.max(1, Math.round((item.price || 10) * 0.55));

    removeByIndex(index);
    PlayerModule.changeGold(income);
    PlayerModule.renderTopPanel();
    renderInventory();
    ShopModule.renderShop();
    UIManager.showToast(`Продано: ${item.name} (+${income} 🪙)`, 'info');
  }

  function matchFilter(item, filter) {
    if (filter === 'all') return true;
    if (filter === 'rare') return ['rare', 'epic', 'legendary'].includes(item.rarity);
    return item.type === filter;
  }

  function renderInventory(filter = InventoryModule.currentFilter) {
    InventoryModule.currentFilter = filter || 'all';
    const p = PlayerModule.getPlayer();
    const list = UIManager.qs('inventoryList');
    const empty = UIManager.qs('inventoryEmpty');
    if (!list || !p) return;

    list.innerHTML = '';
    const inv = ensureInventory();
    const filtered = inv.map((id, index) => ({ id, index, item: GameData.ITEMS[id] })).filter((x) => x.item && matchFilter(x.item, InventoryModule.currentFilter));

    if (!filtered.length) {
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    filtered.forEach(({ item, index }) => {
      const card = document.createElement('article');
      card.className = `item-card ${RARITY_CLASS[item.rarity] || ''}`;
      card.innerHTML = `
        <div class="item-head">
          <h4>${item.icon} ${item.name}</h4>
          <span class="rarity-chip ${item.rarity}">${item.rarity}</span>
        </div>
        <p>${item.description}</p>
      `;
      const actions = document.createElement('div');
      actions.className = 'item-actions';

      if (item.type === 'potion') actions.append(UIManager.makeButton('Использовать', 'primary', () => usePotion(index)));
      if (getSlotByType(item.type)) actions.append(UIManager.makeButton('Экипировать', 'gold', () => equip(index)));
      actions.append(UIManager.makeButton('Продать', 'secondary', () => sell(index)));
      card.append(actions);
      list.append(card);
    });
  }

  function bind() {
    document.querySelectorAll('[data-inv-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-inv-filter]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderInventory(btn.dataset.invFilter);
      });
    });
  }

  const InventoryModule = {
    currentFilter: 'all',
    bind,
    addItem,
    renderInventory
  };

  return InventoryModule;
})();
