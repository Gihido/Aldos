window.InventoryModule = (() => {
  const rarityClass = { common: 'rarity-common', rare: 'rarity-rare', epic: 'rarity-epic', legendary: 'rarity-legendary' };

  function addItem(itemId) {
    const p = PlayerModule.getPlayer();
    p.inventory.push(itemId);
    PlayerModule.savePlayer();
    MainUI.notify(`Получен предмет: ${GameData.ITEMS[itemId].name}`, 'success');
    renderInventory();
  }

  function removeItemByIndex(index) {
    const p = PlayerModule.getPlayer();
    p.inventory.splice(index, 1);
    PlayerModule.savePlayer();
    renderInventory();
  }

  function usePotion(index) {
    const p = PlayerModule.getPlayer();
    const itemId = p.inventory[index];
    const item = GameData.ITEMS[itemId];
    if (!item || item.type !== 'potion') return;
    PlayerModule.heal(item.heal);
    removeItemByIndex(index);
    MainUI.notify(`Вы использовали ${item.name}.`, 'info');
    PlayerModule.renderPanel();
  }

  function equip(index) {
    const p = PlayerModule.getPlayer();
    const itemId = p.inventory[index];
    const item = GameData.ITEMS[itemId];
    if (!item || (item.type !== 'weapon' && item.type !== 'armor')) return;
    const slot = item.type;
    const current = p.equipment[slot];
    p.equipment[slot] = itemId;
    p.inventory.splice(index, 1);
    if (current) p.inventory.push(current);
    PlayerModule.savePlayer();
    PlayerModule.renderPanel();
    renderInventory();
    MainUI.notify(`Экипировано: ${item.name}.`, 'success');
  }

  function sell(index) {
    const p = PlayerModule.getPlayer();
    const item = GameData.ITEMS[p.inventory[index]];
    const sellPrice = Math.round((item.price || 20) * 0.55);
    p.inventory.splice(index, 1);
    PlayerModule.addGold(sellPrice);
    MainUI.notify(`Продано: ${item.name} за ${sellPrice} 🪙`, 'info');
    PlayerModule.renderPanel();
    renderInventory();
  }

  function renderInventory(filter = 'all') {
    const p = PlayerModule.getPlayer();
    const wrapper = document.getElementById('inventoryGrid');
    wrapper.innerHTML = '';

    p.inventory.forEach((itemId, index) => {
      const item = GameData.ITEMS[itemId];
      if (!item) return;
      if (filter !== 'all' && item.type !== filter) return;

      const card = document.createElement('div');
      card.className = `item-card ${rarityClass[item.rarity] || ''}`;
      card.innerHTML = `
        <div class="item-top"><span>${item.icon}</span><strong>${item.name}</strong></div>
        <p>${item.description}</p>
        <small>Редкость: ${item.rarity}</small>
        <div class="item-actions"></div>
      `;

      const actions = card.querySelector('.item-actions');
      const deleteBtn = MainUI.makeButton('Удалить', 'danger', () => removeItemByIndex(index));
      actions.appendChild(deleteBtn);

      if (item.type === 'potion') actions.appendChild(MainUI.makeButton('Использовать', 'primary', () => usePotion(index)));
      if (item.type === 'weapon' || item.type === 'armor') actions.appendChild(MainUI.makeButton('Экипировать', 'primary', () => equip(index)));
      actions.appendChild(MainUI.makeButton('Продать', 'secondary', () => sell(index)));

      wrapper.appendChild(card);
    });

    const eq = p.equipment;
    document.getElementById('equipWeapon').textContent = eq.weapon ? GameData.ITEMS[eq.weapon].name : 'Нет';
    document.getElementById('equipArmor').textContent = eq.armor ? GameData.ITEMS[eq.armor].name : 'Нет';
  }

  function bindFilters() {
    document.querySelectorAll('[data-inv-filter]').forEach((el) => {
      el.addEventListener('click', () => renderInventory(el.dataset.invFilter));
    });
  }

  return { addItem, renderInventory, bindFilters };
})();
