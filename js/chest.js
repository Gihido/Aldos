window.ChestModule = (() => {
  const KEY = 'sok_chest_state_v1';

  function read() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }
  function write(v) { localStorage.setItem(KEY, JSON.stringify(v)); }

  function ensureForLocation(locId) {
    const db = read();
    if (!db[locId]) {
      const roll = Math.random();
      db[locId] = { type: roll < 0.7 ? 'common' : roll < 0.93 ? 'rare' : 'epic', opened: false };
      write(db);
    }
    return db[locId];
  }

  function hasChest() {
    const locId = PlayerModule.getPlayer().locationId;
    return !ensureForLocation(locId).opened;
  }

  function openChest() {
    const locId = PlayerModule.getPlayer().locationId;
    const db = read();
    const chest = ensureForLocation(locId);
    if (chest.opened) return UIManager.showToast('Сундук уже открыт.', 'warning');

    const table = GameData.CHESTS[chest.type];
    const gold = rand(table.gold[0], table.gold[1]);
    const itemId = table.items[Math.floor(Math.random() * table.items.length)];

    PlayerModule.changeGold(gold);
    InventoryModule.addItem(itemId);
    chest.opened = true;
    db[locId] = chest;
    write(db);

    UIManager.showModal('Сундук открыт', `<p>+${gold} 🪙</p><p>${GameData.ITEMS[itemId].name}</p>`, [{ label: 'Забрать', type: 'gold', onClick: UIManager.closeModal }]);
    UIManager.showToast('Добыча получена.', 'loot');
  }

  function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

  return { openChest, hasChest };
})();
