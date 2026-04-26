window.ShopModule = (() => {
  let filter = 'all';

  function renderShop() {
    const loc = LocationsModule.current();
    UIManager.qs('shopHint').textContent = loc.hasMerchant ? 'Торговец готов к сделке.' : 'Торговец доступен только в Деревне Рассвета.';

    const list = UIManager.qs('shopList');
    list.innerHTML = '';

    GameData.MERCHANT_ITEMS.map((id) => GameData.ITEMS[id]).filter(Boolean).filter((i) => filter === 'all' || i.type === filter).forEach((item) => {
      const card = document.createElement('article');
      card.className = 'shop-card';
      card.innerHTML = `<h4>${item.icon} ${item.name}</h4><p>${item.desc}</p><strong>${item.price} 🪙</strong>`;
      card.append(UIManager.makeButton('Купить', loc.hasMerchant ? 'gold' : 'disabled', () => buy(item.id), !loc.hasMerchant));
      list.append(card);
    });

    renderSellList();
  }

  function buy(itemId) {
    const item = GameData.ITEMS[itemId];
    if (!PlayerModule.spendGold(item.price)) return UIManager.showToast('Не хватает золота.', 'warning');
    InventoryModule.addItem(item.id);
    PlayerModule.savePlayer();
    UIManager.renderPlayerHeader();
    renderShop();
  }

  function renderSellList() {
    const p = PlayerModule.getPlayer();
    const list = UIManager.qs('shopSellList');
    list.innerHTML = '';
    p.inventory.forEach((id, idx) => {
      const item = GameData.ITEMS[id];
      if (!item) return;
      const row = document.createElement('div');
      row.className = 'sell-row';
      row.innerHTML = `<span>${item.icon} ${item.name}</span><strong>${Math.round((item.price || 20) * 0.55)} 🪙</strong>`;
      row.append(UIManager.makeButton('Продать', 'secondary', () => {
        p.inventory.splice(idx, 1);
        PlayerModule.changeGold(Math.round((item.price || 20) * 0.55));
        PlayerModule.savePlayer();
        InventoryModule.renderInventory();
        UIManager.renderPlayerHeader();
        renderShop();
      }));
      list.append(row);
    });
  }

  function bind() {
    document.querySelectorAll('[data-shop-filter]').forEach((b) => {
      b.onclick = () => { filter = b.dataset.shopFilter; renderShop(); };
    });
  }

  return { renderShop, bind };
})();
