window.ShopModule = (() => {
  function allowed(item) {
    const p = PlayerModule.getPlayer();
    if (item.rarity === 'mythic') return p.level >= 10;
    if (item.rarity === 'legendary') return p.level >= 8;
    if (item.rarity === 'epic') return p.level >= 5;
    if (item.rarity === 'rare') return p.level >= 3;
    return true;
  }

  function buy(itemId) {
    const item = GameData.ITEMS[itemId];
    if (!item) return;
    if (!PlayerModule.spendGold(item.price || 0)) return UIManager.showToast('Недостаточно золота.', 'error');
    InventoryModule.addItem(item.id);
    PlayerModule.renderTopPanel();
    renderShop();
  }

  function renderShop() {
    const box = UIManager.qs('shopItems');
    if (!box) return;
    box.innerHTML = '';

    const hasMerchant = LocationsModule.getCurrentLocation()?.hasMerchant;
    UIManager.safeSetText('shopHint', hasMerchant ? 'Торговец открыт.' : 'Торговец недоступен в этой локации.');

    GameData.MERCHANT_ITEMS.map((id) => GameData.ITEMS[id]).filter(Boolean).forEach((item) => {
      const can = hasMerchant && allowed(item) && PlayerModule.getPlayer().gold >= (item.price || 0);
      const card = document.createElement('article');
      card.className = 'shop-card';
      card.innerHTML = `<div class="shop-top"><h4>${item.icon} ${item.name}</h4><strong>${item.price || 0} 🪙</strong></div><p>${item.rarity}</p>`;
      card.append(UIManager.makeButton('Купить', can ? 'gold' : 'disabled', () => buy(item.id), !can));
      box.append(card);
    });
  }

  return { renderShop };
})();
