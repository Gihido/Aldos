window.ChestModule = (() => {
  const KEY = 'sok_found_chests';
  const getState = () => JSON.parse(localStorage.getItem(KEY) || '{}');
  const setState = (data) => localStorage.setItem(KEY, JSON.stringify(data));

  function hasChest(locationId) {
    return !!getState()[locationId];
  }

  function markChestFound(locationId) {
    const state = getState();
    if (state[locationId]) return;
    state[locationId] = { foundAt: Date.now(), opened: false };
    setState(state);
    MainUI.notify('Вы нашли сундук!', 'success');
    MainUI.logEvent('Найден сундук в локации.');
    LocationsModule.renderLocations();
  }

  function openChest(locationId) {
    const state = getState();
    const entry = state[locationId];
    if (!entry || entry.opened) {
      MainUI.notify('Сундук уже открыт.', 'warn');
      return;
    }

    const tier = Math.random() <= 0.3 ? 'rare' : 'common';
    const table = GameData.CHESTS[tier];
    const gold = rand(table.gold[0], table.gold[1]);

    PlayerModule.addGold(gold);
    let obtained = [];
    table.itemDrops.forEach((drop) => {
      if (Math.random() <= drop.chance) {
        InventoryModule.addItem(drop.itemId);
        obtained.push(GameData.ITEMS[drop.itemId].name);
      }
    });

    entry.opened = true;
    setState(state);

    const reward = obtained.length ? `${gold} 🪙 + ${obtained.join(', ')}` : `${gold} 🪙`;
    showChestModal(reward);
    MainUI.logEvent(`Открыт сундук (${tier}): ${reward}`);
    LocationsModule.renderLocations();
    PlayerModule.renderPanel();
  }

  function showChestModal(text) {
    const modal = document.getElementById('chestModal');
    modal.classList.add('show');
    document.getElementById('chestRewardText').textContent = text;
    const box = document.getElementById('chestBox');
    box.classList.remove('open');
    void box.offsetWidth;
    box.classList.add('open');
  }

  function bind() {
    document.getElementById('closeChestModal').addEventListener('click', () => {
      document.getElementById('chestModal').classList.remove('show');
    });
  }

  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  return { hasChest, markChestFound, openChest, bind };
})();
