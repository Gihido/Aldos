window.ChestModule = (() => {
  const KEY = 'sok_chests_v3';

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  }
  function write(v) { localStorage.setItem(KEY, JSON.stringify(v)); }

  function hasChest(locationId) {
    const db = read();
    return !!db[`loc_${locationId}`] && !db[`loc_${locationId}`].opened;
  }

  function generateChest(locationId) {
    const db = read();
    const key = `loc_${locationId}`;
    if (db[key] && !db[key].opened) return db[key];
    const roll = Math.random();
    const type = roll < 0.62 ? 'common' : roll < 0.84 ? 'rare' : 'epic';
    db[key] = { chestId: key, type, locationId, opened: false, createdAt: Date.now() };
    write(db);
    return db[key];
  }

  function rollChestReward(type) {
    const table = GameData.CHESTS[type] || GameData.CHESTS.common;
    const gold = rand(table.gold[0], table.gold[1]);
    const itemId = table.items[Math.floor(Math.random() * table.items.length)];
    return { gold, itemId, type, curse: type === 'cursed' && Math.random() <= (table.curseChance || 0) };
  }

  function openChest(chestId) {
    const db = read();
    const chest = db[chestId];
    if (!chest || chest.opened) return UIManager.showToast('Сундук уже открыт.', 'warning');

    const reward = rollChestReward(chest.type);
    chest.opened = true;
    chest.openedAt = Date.now();
    db[chestId] = chest;
    write(db);

    if (reward.curse) {
      UIManager.showToast('Проклятый сундук пробуждает монстра!', 'error');
      CombatModule.startCombat(PlayerModule.getPlayer().locationId);
      return;
    }

    PlayerModule.changeGold(reward.gold);
    InventoryModule.addItem(reward.itemId);
    PlayerModule.autosave();
    UIManager.showLootPopup({ gold: reward.gold, exp: 0, items: [GameData.ITEMS[reward.itemId]?.name || reward.itemId] });
    UIManager.showToast('Сундук открыт!', 'loot');
    LocationsModule.renderLocationsScreen();
  }

  function openDailyChest() {
    const p = PlayerModule.getPlayer();
    const now = Date.now();
    if (now - (p.lastDailyChestAt || 0) < 24 * 60 * 60 * 1000) {
      return UIManager.showToast('Ежедневный сундук уже открыт сегодня.', 'warning');
    }

    const reward = rollChestReward('daily');
    p.lastDailyChestAt = now;
    PlayerModule.changeGold(reward.gold);
    InventoryModule.addItem(reward.itemId);
    PlayerModule.autosave();
    UIManager.showLootPopup({ gold: reward.gold, exp: 0, items: [GameData.ITEMS[reward.itemId]?.name || reward.itemId] });
  }

  function openClanChest() {
    const p = PlayerModule.getPlayer();
    if (!p.clanId) return UIManager.showToast('Клановый сундук доступен только клану.', 'warning');
    const reward = rollChestReward('clan');
    PlayerModule.changeGold(reward.gold);
    InventoryModule.addItem(reward.itemId);
    PlayerModule.autosave();
    UIManager.showLootPopup({ gold: reward.gold, exp: 0, items: [GameData.ITEMS[reward.itemId]?.name || reward.itemId] });
  }

  function markChestFound(locationId) {
    generateChest(locationId);
  }

  function rand(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  return { generateChest, openChest, openDailyChest, openClanChest, rollChestReward, hasChest, markChestFound };
})();
