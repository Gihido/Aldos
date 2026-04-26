window.GameData = (() => {
  const CLASSES = {
    warrior: { id: 'warrior', name: 'Воин', icon: '⚔️', description: 'Высокий запас HP и защита.', hp: 145, damage: [10, 16], defense: 5, feature: 'Стойкость' },
    mage: { id: 'mage', name: 'Маг', icon: '🔮', description: 'Сильные удары и высокий burst.', hp: 110, damage: [13, 21], defense: 2, feature: 'Магический импульс' },
    archer: { id: 'archer', name: 'Лучник', icon: '🏹', description: 'Критические попадания и мобильность.', hp: 125, damage: [11, 18], defense: 3, feature: 'Меткий выстрел' }
  };

  const ITEMS = {
    potion_small: { id: 'potion_small', name: 'Малое зелье HP', type: 'potion', rarity: 'common', heal: 35, price: 25, icon: '🧪', desc: 'Восстанавливает 35 HP.' },
    potion_medium: { id: 'potion_medium', name: 'Среднее зелье HP', type: 'potion', rarity: 'rare', heal: 70, price: 60, icon: '🧴', desc: 'Восстанавливает 70 HP.' },
    sword_rusty: { id: 'sword_rusty', name: 'Ржавый меч', type: 'weapon', rarity: 'common', minDamageBonus: 1, maxDamageBonus: 3, price: 45, icon: '⚔️', desc: 'Старое, но острое железо.' },
    bow_hunter: { id: 'bow_hunter', name: 'Лук охотника', type: 'weapon', rarity: 'rare', minDamageBonus: 3, maxDamageBonus: 6, critChanceBonus: 0.05, price: 160, icon: '🏹', desc: 'Удобен для точных ударов.' },
    staff_arcane: { id: 'staff_arcane', name: 'Арканный посох', type: 'weapon', rarity: 'epic', minDamageBonus: 4, maxDamageBonus: 8, price: 210, icon: '🔮', desc: 'Резонанс чистой маны.' },
    armor_leather: { id: 'armor_leather', name: 'Кожаная броня', type: 'armor', rarity: 'common', defenseBonus: 2, maxHpBonus: 15, price: 85, icon: '🛡️', desc: 'Лёгкая защита.' },
    armor_guard: { id: 'armor_guard', name: 'Доспех стража', type: 'armor', rarity: 'epic', defenseBonus: 5, maxHpBonus: 32, price: 300, icon: '🛡️', desc: 'Тяжёлая надёжная броня.' },
    wolf_fang: { id: 'wolf_fang', name: 'Клык волка', type: 'material', rarity: 'common', price: 15, icon: '🦷', desc: 'Материал для ремесла.' },
    spider_gland: { id: 'spider_gland', name: 'Ядовитая железа паука', type: 'material', rarity: 'rare', price: 58, icon: '🕷️', desc: 'Редкий трофей.' },
    rune_shard: { id: 'rune_shard', name: 'Осколок древней руны', type: 'material', rarity: 'epic', price: 160, icon: '🧿', desc: 'Энергия руин.' }
  };

  const LOCATIONS = [
    { id: 'dawn_village', name: 'Деревня Рассвета', icon: '🏘️', desc: 'Безопасная стартовая зона и торговец.', recLevel: 1, monsters: [], chestChance: 0.1, hasMerchant: true, bg: 'linear-gradient(145deg,#2b1e3f,#4f3b65)' },
    { id: 'dark_forest', name: 'Тёмный лес', icon: '🌲', desc: 'Чащоба с хищниками и разбойниками.', recLevel: 2, monsters: ['forest_wolf', 'bandit', 'poison_spider'], chestChance: 0.22, hasMerchant: false, bg: 'linear-gradient(145deg,#13261f,#2e5447)' },
    { id: 'abandoned_mine', name: 'Заброшенная шахта', icon: '⛏️', desc: 'Сырые тоннели и тяжёлые враги.', recLevel: 4, monsters: ['stone_beetle', 'mine_golem', 'skeleton_miner'], chestChance: 0.28, hasMerchant: false, bg: 'linear-gradient(145deg,#171718,#3f3935)' },
    { id: 'king_ruins', name: 'Руины короля', icon: '🏰', desc: 'Древняя магия и элитные стражи.', recLevel: 6, monsters: ['skeleton_guard', 'ancient_mage', 'shadow_king'], chestChance: 0.34, hasMerchant: false, bg: 'linear-gradient(145deg,#1f1530,#4a2b62)' }
  ];

  const MONSTERS = {
    forest_wolf: { id: 'forest_wolf', name: 'Лесной волк', description: 'Быстрый хищник.', hp: 58, damage: [7, 12], defense: 1, exp: [15, 24], gold: [8, 16], lootTable: ['wolf_fang', 'potion_small'], rareLoot: ['sword_rusty'] },
    bandit: { id: 'bandit', name: 'Разбойник', description: 'Охотится на путников.', hp: 66, damage: [8, 14], defense: 2, exp: [18, 28], gold: [12, 22], lootTable: ['potion_small', 'sword_rusty'], rareLoot: ['armor_leather'] },
    poison_spider: { id: 'poison_spider', name: 'Ядовитый паук', description: 'Отравляющий укус.', hp: 72, damage: [9, 15], defense: 2, exp: [22, 32], gold: [14, 24], lootTable: ['spider_gland', 'potion_small'], rareLoot: ['bow_hunter'] },
    stone_beetle: { id: 'stone_beetle', name: 'Каменный жук', description: 'Твёрдый панцирь.', hp: 92, damage: [11, 18], defense: 4, exp: [28, 40], gold: [20, 34], lootTable: ['rune_shard', 'potion_medium'], rareLoot: ['armor_leather'] },
    mine_golem: { id: 'mine_golem', name: 'Шахтный голем', description: 'Мощный сторож шахты.', hp: 115, damage: [13, 22], defense: 5, exp: [35, 48], gold: [28, 44], lootTable: ['rune_shard', 'potion_medium'], rareLoot: ['staff_arcane'] },
    skeleton_miner: { id: 'skeleton_miner', name: 'Скелет-шахтёр', description: 'Остатки проклятой бригады.', hp: 100, damage: [12, 20], defense: 4, exp: [30, 42], gold: [24, 38], lootTable: ['rune_shard', 'wolf_fang'], rareLoot: ['bow_hunter'] },
    skeleton_guard: { id: 'skeleton_guard', name: 'Скелет-страж', description: 'Служит руинам вечно.', hp: 128, damage: [16, 24], defense: 6, exp: [44, 60], gold: [36, 56], lootTable: ['rune_shard', 'potion_medium'], rareLoot: ['armor_guard'] },
    ancient_mage: { id: 'ancient_mage', name: 'Древний маг', description: 'Повелитель запретных рун.', hp: 138, damage: [17, 27], defense: 6, exp: [50, 68], gold: [44, 66], lootTable: ['rune_shard', 'spider_gland'], rareLoot: ['staff_arcane'] },
    shadow_king: { id: 'shadow_king', name: 'Король теней', description: 'Босс руин короля.', hp: 190, damage: [22, 34], defense: 8, exp: [70, 98], gold: [70, 110], lootTable: ['rune_shard', 'potion_medium'], rareLoot: ['armor_guard'] }
  };

  const CHESTS = {
    common: { gold: [18, 48], items: ['potion_small', 'wolf_fang', 'sword_rusty'] },
    rare: { gold: [45, 95], items: ['potion_medium', 'spider_gland', 'armor_leather'] },
    epic: { gold: [90, 170], items: ['staff_arcane', 'armor_guard', 'rune_shard'] }
  };

  const MERCHANT_ITEMS = ['potion_small', 'potion_medium', 'sword_rusty', 'bow_hunter', 'armor_leather'];

  return { CLASSES, ITEMS, LOCATIONS, MONSTERS, CHESTS, MERCHANT_ITEMS };
})();
