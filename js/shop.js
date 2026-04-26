window.ShopModule = (() => {
  function getAvailableItems() {
    const p = PlayerModule.getPlayer();
    return GameData.MERCHANT_ITEMS
      .map((id) => GameData.ITEMS[id])
      .filter(Boolean)
      .filter((item) => {
        if (item.rarity === 'legendary') return p.level >= 7;
        if (item.rarity === 'epic') return p.level >= 4;
        if (item.rarity === 'rare') return p.level >= 2;
        return true;
      });
  }

  function buy(itemId) {
    const item = GameData.ITEMS[itemId];
    if (!item) return;

    if (!PlayerModule.spendGold(item.price)) {
      UIManager.showToast('Недостаточно золота.', 'error');
      return;
    }

    InventoryModule.addItem(item.id);
    PlayerModule.renderTopPanel();
    renderShop();
    UIManager.pushEvent(`Покупка: ${item.name}`);
    UIManager.showToast(`Куплено: ${item.name}`, 'success');
  }

  function sell(index) {
    InventoryModule.renderInventory();
    // Продажа реализована в инвентаре, тут только подсказка.
    UIManager.showToast('Для продажи используйте кнопку "Продать" в инвентаре.', 'info');
  }

  function renderShop() {
    const list = UIManager.qs('shopItems');
    if (!list) return;
    list.innerHTML = '';

    const player = PlayerModule.getPlayer();
    const loc = LocationsModule.getCurrentLocation();
    UIManager.safeSetText('shopHint', loc?.hasMerchant ? 'Торговец готов к сделке.' : 'В этой локации нет торговца.');

    getAvailableItems().forEach((item) => {
      const canBuy = player.gold >= item.price && !!loc?.hasMerchant;
      const card = document.createElement('article');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="shop-top">
          <h4>${item.icon} ${item.name}</h4>
          <strong>${item.price} 🪙</strong>
        </div>
        <p>${item.description}</p>
      `;

      card.append(UIManager.makeButton('Купить', canBuy ? 'gold' : 'disabled', () => buy(item.id), !canBuy));
      list.append(card);
    });

    const sellBtn = UIManager.qs('sellFromShopBtn');
    if (sellBtn) {
      sellBtn.onclick = () => sell(0);
    }
  }

  return { renderShop };
})();
