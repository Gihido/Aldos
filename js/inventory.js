window.InventoryModule = (() => {
  function addItem(itemId) {
    const item = GameData.ITEMS[itemId];
    if (!item) return false;
    const p = PlayerModule.getPlayer();
    p.inventory.push(itemId);
    PlayerModule.savePlayer();
    UIManager.showToast(`Получен предмет: ${item.name}`, 'loot');
    renderInventory();
    return true;
  }

  function renderInventory(filter = 'all') {
    const p = PlayerModule.getPlayer();
    const box = UIManager.qs('inventoryList');
    const empty = UIManager.qs('inventoryEmpty');
    box.innerHTML = '';

    const items = p.inventory.map((id, index) => ({ item: GameData.ITEMS[id], index })).filter((x) => x.item && (filter === 'all' || (filter === 'rare' ? ['rare', 'epic'].includes(x.item.rarity) : x.item.type === filter)));
    if (!items.length) { empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');

    items.forEach(({ item, index }) => {
      const card = document.createElement('article');
      card.className = `item-card rarity-${item.rarity}`;
      card.innerHTML = `<div class="item-head"><h4>${item.icon} ${item.name}</h4><span>${item.rarity}</span></div><p>${item.desc || item.type}</p>`;
      const actions = document.createElement('div');
      actions.className = 'row wrap';

      if (item.type === 'potion') actions.append(UIManager.makeButton('Использовать', 'primary', () => { PlayerModule.heal(item.heal || 0); p.inventory.splice(index, 1); PlayerModule.savePlayer(); UIManager.renderPlayerHeader(); renderInventory(filter); }));
      if (item.type === 'weapon' || item.type === 'armor') actions.append(UIManager.makeButton('Экипировать', 'gold', () => equip(index, item.type)));
      actions.append(UIManager.makeButton('Продать', 'secondary', () => sell(index)));
      card.append(actions);
      box.append(card);
    });
  }

  function equip(index, slot) {
    const p = PlayerModule.getPlayer();
    const itemId = p.inventory[index];
    const prev = p.equipment[slot];
    p.equipment[slot] = itemId;
    p.inventory.splice(index, 1);
    if (prev) p.inventory.push(prev);
    PlayerModule.savePlayer();
    UIManager.renderPlayerHeader();
    MainModule.renderCharacter();
    renderInventory();
  }

  function sell(index) {
    const p = PlayerModule.getPlayer();
    const item = GameData.ITEMS[p.inventory[index]];
    p.inventory.splice(index, 1);
    PlayerModule.changeGold(Math.max(1, Math.round((item.price || 20) * 0.55)));
    PlayerModule.savePlayer();
    UIManager.renderPlayerHeader();
    renderInventory();
  }

  function bind() {
    document.querySelectorAll('[data-inv-filter]').forEach((b) => {
      b.onclick = () => {
        document.querySelectorAll('[data-inv-filter]').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        renderInventory(b.dataset.invFilter);
      };
    });
  }

  return { addItem, renderInventory, bind };
})();
