window.GameData = (() => {
  const CLASSES = {
    warrior: { id: 'warrior', name: 'Воин', icon: '⚔️', baseStats: { maxHp: 145, minDamage: 10, maxDamage: 16, critChance: 0.08, defense: 5, energy: 100 } },
    mage: { id: 'mage', name: 'Маг', icon: '🔮', baseStats: { maxHp: 105, minDamage: 13, maxDamage: 21, critChance: 0.1, defense: 2, energy: 120 } },
    archer: { id: 'archer', name: 'Лучник', icon: '🏹', baseStats: { maxHp: 120, minDamage: 11, maxDamage: 18, critChance: 0.18, defense: 3, energy: 110 } }
  };

  const ITEMS = {
    // поты
    potion_small: { id: 'potion_small', name: 'Малое зелье HP', type: 'potion', rarity: 'common', heal: 35, price: 25, icon: '🧪' },
    potion_medium: { id: 'potion_medium', name: 'Среднее зелье HP', type: 'potion', rarity: 'rare', heal: 70, price: 60, icon: '🧴' },
    potion_energy: { id: 'potion_energy', name: 'Зелье энергии', type: 'potion', rarity: 'rare', restoreEnergy: 35, price: 55, icon: '⚡' },
    // оружие
    sword_rusty: { id: 'sword_rusty', name: 'Ржавый меч', type: 'weapon', rarity: 'common', minDamageBonus: 1, maxDamageBonus: 3, price: 45, icon: '⚔️' },
    sword_novice: { id: 'sword_novice', name: 'Меч новичка', type: 'weapon', rarity: 'common', minDamageBonus: 2, maxDamageBonus: 4, price: 90, icon: '⚔️' },
    bow_hunter: { id: 'bow_hunter', name: 'Лук охотника', type: 'weapon', rarity: 'rare', minDamageBonus: 3, maxDamageBonus: 6, critChanceBonus: 0.06, price: 165, icon: '🏹' },
    staff_arcane: { id: 'staff_arcane', name: 'Магический посох', type: 'weapon', rarity: 'epic', minDamageBonus: 4, maxDamageBonus: 8, critChanceBonus: 0.03, price: 185, icon: '🔮' },
    // броня/акс
    armor_leather: { id: 'armor_leather', name: 'Кожаная броня', type: 'armor', rarity: 'common', maxHpBonus: 15, defenseBonus: 2, price: 80, icon: '🛡️' },
    armor_king_guard: { id: 'armor_king_guard', name: 'Доспех стражи', type: 'armor', rarity: 'legendary', maxHpBonus: 36, defenseBonus: 5, price: 330, icon: '🛡️' },
    ring_hunter: { id: 'ring_hunter', name: 'Кольцо охотника', type: 'ring', rarity: 'rare', minDamageBonus: 2, maxDamageBonus: 3, price: 170, icon: '💍' },
    amulet_life: { id: 'amulet_life', name: 'Амулет жизни', type: 'amulet', rarity: 'epic', maxHpBonus: 20, price: 240, icon: '📿' },
    // материалы/ключи/квест
    wolf_fang: { id: 'wolf_fang', name: 'Клык волка', type: 'material', rarity: 'common', price: 22, icon: '🦷' },
    wolf_hide: { id: 'wolf_hide', name: 'Шкура волка', type: 'material', rarity: 'common', price: 20, icon: '🧥' },
    spider_gland: { id: 'spider_gland', name: 'Ядовитая железа паука', type: 'material', rarity: 'rare', price: 55, icon: '🕷️' },
    miner_stone: { id: 'miner_stone', name: 'Камень шахтёра', type: 'material', rarity: 'common', price: 30, icon: '🪨' },
    rune_shard: { id: 'rune_shard', name: 'Осколок древней руны', type: 'material', rarity: 'epic', price: 140, icon: '🧿' },
    monster_heart: { id: 'monster_heart', name: 'Сердце чудовища', type: 'material', rarity: 'legendary', price: 330, icon: '❤️' },
    dark_essence: { id: 'dark_essence', name: 'Тёмная эссенция', type: 'material', rarity: 'mythic', price: 500, icon: '🌑' },
    mana_dust: { id: 'mana_dust', name: 'Пыль маны', type: 'material', rarity: 'rare', price: 75, icon: '✨' },
    bronze_key: { id: 'bronze_key', name: 'Бронзовый ключ', type: 'key', rarity: 'rare', price: 120, icon: '🗝️' },
    relic_map: { id: 'relic_map', name: 'Карта руин', type: 'quest', rarity: 'epic', price: 0, icon: '🗺️' }
  };

  const LOCATIONS = [
    { id: 'dawn_village', name: 'Деревня Рассвета', icon: '🏘️', minLevel: 1, description: 'Стартовая безопасная зона.', background: 'linear-gradient(145deg,#2a1d3a,#4a345e)', monsters: ['forest_wolf', 'bandit'], chestChance: 0.16, hasMerchant: true },
    { id: 'dark_forest', name: 'Тёмный лес', icon: '🌲', minLevel: 2, description: 'Шёпот теней и хищники.', background: 'linear-gradient(145deg,#12251f,#2f5b4e)', monsters: ['forest_wolf', 'poison_spider'], chestChance: 0.22, hasMerchant: false },
    { id: 'deep_forest', name: 'Глубокий лес', icon: '🌳', minLevel: 3, description: 'Опасные тропы и засады.', background: 'linear-gradient(145deg,#0f2a1d,#264935)', monsters: ['bandit', 'poison_spider'], chestChance: 0.24, hasMerchant: false },
    { id: 'abandoned_mine', name: 'Заброшенная шахта', icon: '⛏️', minLevel: 4, description: 'Подземные големы и стражи.', background: 'linear-gradient(145deg,#171718,#3f3935)', monsters: ['skeleton_guard', 'mine_golem'], chestChance: 0.28, hasMerchant: true },
    { id: 'underground_market', name: 'Подземный рынок', icon: '🛒', minLevel: 4, description: 'Чёрный рынок и редкие товары.', background: 'linear-gradient(145deg,#2a2020,#5a3b31)', monsters: ['bandit', 'dark_knight'], chestChance: 0.21, hasMerchant: true },
    { id: 'king_ruins', name: 'Руины короля', icon: '🏰', minLevel: 5, description: 'Руны, магия и древние стражи.', background: 'linear-gradient(145deg,#1e1532,#4a2e63)', monsters: ['dark_knight', 'ancient_mage'], chestChance: 0.35, hasMerchant: false },
    { id: 'witch_swamp', name: 'Болото ведьмы', icon: '🧙', minLevel: 6, description: 'Яд и проклятья.', background: 'linear-gradient(145deg,#1a2d22,#445a3e)', monsters: ['swamp_witch', 'poison_spider'], chestChance: 0.33, hasMerchant: false },
    { id: 'north_fortress', name: 'Северная крепость', icon: '🛡️', minLevel: 7, description: 'Ледяные стены и элита теней.', background: 'linear-gradient(145deg,#21314d,#4d6486)', monsters: ['dark_knight', 'ancient_mage'], chestChance: 0.36, hasMerchant: false },
    { id: 'dragon_cave', name: 'Пещера дракона', icon: '🐲', minLevel: 8, description: 'Огненное ядро гор.', background: 'linear-gradient(145deg,#381a1a,#7d3326)', monsters: ['fire_dragon', 'ancient_mage'], chestChance: 0.4, hasMerchant: false },
    { id: 'monster_lair', name: 'Логово чудовища', icon: '👹', minLevel: 9, description: 'Финальное испытание Теней.', background: 'linear-gradient(145deg,#2b1016,#652437)', monsters: ['shadow_king', 'fire_dragon'], chestChance: 0.45, hasMerchant: false }
  ];

  const MONSTERS = {
    forest_wolf: { id: 'forest_wolf', name: 'Лесной волк', level: 1, hp: 52, damage: [6, 11], defense: 1, exp: [16, 24], gold: [9, 16], lootTable: ['wolf_fang', 'wolf_hide'], rareLoot: ['ring_hunter'], monsterParts: ['wolf_fang', 'wolf_hide'] },
    bandit: { id: 'bandit', name: 'Разбойник', level: 2, hp: 62, damage: [8, 13], defense: 2, exp: [20, 30], gold: [12, 22], lootTable: ['sword_rusty', 'bronze_key'], rareLoot: ['ring_hunter'], monsterParts: ['miner_stone'] },
    poison_spider: { id: 'poison_spider', name: 'Ядовитый паук', level: 3, hp: 70, damage: [8, 15], defense: 2, exp: [24, 34], gold: [16, 28], lootTable: ['spider_gland', 'mana_dust'], rareLoot: ['amulet_life'], monsterParts: ['spider_gland'] },
    skeleton_guard: { id: 'skeleton_guard', name: 'Скелет-страж', level: 4, hp: 84, damage: [10, 17], defense: 3, exp: [30, 42], gold: [20, 34], lootTable: ['miner_stone', 'rune_shard'], rareLoot: ['armor_leather'], monsterParts: ['rune_shard'] },
    mine_golem: { id: 'mine_golem', name: 'Шахтный голем', level: 5, hp: 102, damage: [12, 20], defense: 4, exp: [36, 50], gold: [28, 46], lootTable: ['miner_stone', 'rune_shard'], rareLoot: ['staff_arcane'], monsterParts: ['miner_stone'] },
    swamp_witch: { id: 'swamp_witch', name: 'Болотная ведьма', level: 6, hp: 116, damage: [14, 22], defense: 4, exp: [42, 58], gold: [36, 56], lootTable: ['mana_dust', 'rune_shard'], rareLoot: ['amulet_life'], monsterParts: ['dark_essence'] },
    dark_knight: { id: 'dark_knight', name: 'Тёмный рыцарь', level: 7, hp: 132, damage: [16, 24], defense: 5, exp: [50, 68], gold: [44, 66], lootTable: ['sword_novice', 'rune_shard'], rareLoot: ['armor_king_guard'], monsterParts: ['dark_essence'] },
    ancient_mage: { id: 'ancient_mage', name: 'Древний маг', level: 8, hp: 140, damage: [17, 27], defense: 5, exp: [56, 76], gold: [52, 76], lootTable: ['mana_dust', 'amulet_life'], rareLoot: ['staff_arcane'], monsterParts: ['mana_dust'] },
    fire_dragon: { id: 'fire_dragon', name: 'Огненный дракон', level: 9, hp: 178, damage: [20, 31], defense: 7, exp: [70, 95], gold: [70, 105], lootTable: ['monster_heart', 'rune_shard'], rareLoot: ['armor_king_guard'], monsterParts: ['monster_heart'] },
    shadow_king: { id: 'shadow_king', name: 'Король теней', level: 10, hp: 230, damage: [24, 36], defense: 9, exp: [95, 130], gold: [110, 160], lootTable: ['dark_essence', 'monster_heart'], rareLoot: ['dark_essence'], monsterParts: ['dark_essence'] }
  };

  const CHEST_TYPES = ['common', 'rare', 'epic', 'cursed', 'clan', 'daily'];

  const CHESTS = {
    common: { gold: [20, 55], items: ['potion_small', 'wolf_fang', 'sword_rusty'] },
    rare: { gold: [50, 120], items: ['potion_medium', 'ring_hunter', 'mana_dust'] },
    epic: { gold: [110, 220], items: ['amulet_life', 'staff_arcane', 'rune_shard'] },
    cursed: { gold: [0, 260], items: ['dark_essence', 'monster_heart'], curseChance: 0.35 },
    clan: { gold: [80, 180], items: ['rune_shard', 'armor_leather', 'ring_hunter'] },
    daily: { gold: [40, 95], items: ['potion_medium', 'bronze_key', 'mana_dust'] }
  };

  const MERCHANT_ITEMS = ['potion_small', 'potion_medium', 'potion_energy', 'sword_rusty', 'sword_novice', 'armor_leather', 'ring_hunter', 'amulet_life'];

  return { CLASSES, ITEMS, LOCATIONS, MONSTERS, CHEST_TYPES, CHESTS, MERCHANT_ITEMS };
})();
