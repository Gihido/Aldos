window.ShopModule = (() => {
  function open() {
    renderShopItems();
    renderSellItems();
    document.getElementById('shopModal').classList.add('show');
  }

  function close() {
    document.getElementById('shopModal').classList.remove('show');
  }

  function getAvailableItems() {
    const p = PlayerModule.getPlayer();
    return GameData.MERCHANT_ITEMS
      .map((id) => GameData.ITEMS[id])
      .filter((item) => {
        if (item.rarity === 'legendary') return p.level >= 7;
        if (item.rarity === 'epic') return p.level >= 4;
        if (item.rarity === 'rare') return p.level >= 2;
        return true;
      });
  }

  function renderShopItems() {
    const list = document.getElementById('shopBuyList');
    list.innerHTML = '';
    getAvailableItems().forEach((item) => {
      const row = document.createElement('div');
      row.className = 'shop-row';
      row.innerHTML = `<span>${item.icon} ${item.name}</span><strong>${item.price} 🪙</strong>`;
      row.appendChild(MainUI.makeButton('Купить', 'gold', () => buy(item.id)));
      list.appendChild(row);
    });
  }

  function renderSellItems() {
    const p = PlayerModule.getPlayer();
    const list = document.getElementById('shopSellList');
    list.innerHTML = '';
    p.inventory.forEach((itemId, idx) => {
      const item = GameData.ITEMS[itemId];
      const price = Math.round((item.price || 10) * 0.55);
      const row = document.createElement('div');
      row.className = 'shop-row';
      row.innerHTML = `<span>${item.icon} ${item.name}</span><strong>${price} 🪙</strong>`;
      row.appendChild(MainUI.makeButton('Продать', 'secondary', () => sell(idx, price)));
      list.appendChild(row);
    });
  }

  function buy(itemId) {
    const item = GameData.ITEMS[itemId];
    if (!PlayerModule.spendGold(item.price)) {
      MainUI.notify('Недостаточно золота.', 'danger');
      return;
    }
    InventoryModule.addItem(itemId);
    PlayerModule.renderPanel();
    renderSellItems();
    MainUI.notify(`Покупка: ${item.name}`, 'success');
    MainUI.logEvent('Покупка в магазине.');
  }

  function sell(index, price) {
    const p = PlayerModule.getPlayer();
    const item = GameData.ITEMS[p.inventory[index]];
    p.inventory.splice(index, 1);
    PlayerModule.addGold(price);
    PlayerModule.savePlayer();
    PlayerModule.renderPanel();
    InventoryModule.renderInventory();
    renderSellItems();
    MainUI.notify(`Продано: ${item.name}`, 'info');
    MainUI.logEvent('Продажа в магазине.');
  }

  function bind() {
    document.getElementById('closeShopModal').addEventListener('click', close);
  }

  return { open, bind };
})();
