// Центральный справочник игровых данных.
window.GameData = (() => {
  const CLASSES = {
    warrior: {
      id: 'warrior',
      name: 'Воин',
      icon: '⚔️',
      description: 'Высокое здоровье, стабильный урон и крепкая защита.',
      baseStats: { maxHp: 130, minDamage: 10, maxDamage: 16, critChance: 0.08, defense: 5, energy: 100 }
    },
    mage: {
      id: 'mage',
      name: 'Маг',
      icon: '🔮',
      description: 'Сильные магические удары, но меньший запас здоровья.',
      baseStats: { maxHp: 95, minDamage: 12, maxDamage: 20, critChance: 0.1, defense: 2, energy: 120 }
    },
    archer: {
      id: 'archer',
      name: 'Лучник',
      icon: '🏹',
      description: 'Хороший баланс и высокий шанс критического удара.',
      baseStats: { maxHp: 110, minDamage: 11, maxDamage: 17, critChance: 0.18, defense: 3, energy: 110 }
    }
  };

  const ITEMS = {
    potion_small: { id: 'potion_small', name: 'Малое зелье HP', type: 'potion', rarity: 'common', heal: 30, price: 25, icon: '🧪', description: 'Восстанавливает 30 HP.' },
    potion_medium: { id: 'potion_medium', name: 'Среднее зелье HP', type: 'potion', rarity: 'rare', heal: 60, price: 60, icon: '🧴', description: 'Восстанавливает 60 HP.' },
    sword_novice: { id: 'sword_novice', name: 'Меч новичка', type: 'weapon', rarity: 'common', minDamageBonus: 2, maxDamageBonus: 4, price: 90, icon: '⚔️', description: 'Простой клинок для первых вылазок.' },
    staff_arcane: { id: 'staff_arcane', name: 'Магический посох', type: 'weapon', rarity: 'epic', minDamageBonus: 4, maxDamageBonus: 7, critChanceBonus: 0.03, price: 180, icon: '🔮', description: 'Сфокусированная арканная мощь.' },
    bow_hunter: { id: 'bow_hunter', name: 'Лук охотника', type: 'weapon', rarity: 'rare', minDamageBonus: 3, maxDamageBonus: 6, critChanceBonus: 0.06, price: 160, icon: '🏹', description: 'Увеличивает шанс точного критического выстрела.' },
    armor_leather: { id: 'armor_leather', name: 'Кожаная броня', type: 'armor', rarity: 'common', maxHpBonus: 15, defenseBonus: 2, price: 80, icon: '🛡️', description: 'Базовая защита путешественника.' },
    armor_king_guard: { id: 'armor_king_guard', name: 'Доспех королевской стражи', type: 'armor', rarity: 'legendary', maxHpBonus: 35, defenseBonus: 5, price: 320, icon: '🛡️', description: 'Реликвия старого королевства.' },
    gem_shadow: { id: 'gem_shadow', name: 'Теневая гемма', type: 'material', rarity: 'epic', price: 220, icon: '💎', description: 'Редкий кристалл для ценных сделок.' }
  };

  const MONSTERS = {
    wolf: { id: 'wolf', name: 'Голодный волк', hp: 45, damage: [6, 11], rewardGold: [8, 16], rewardExp: [14, 24], lootTable: [{ itemId: 'potion_small', chance: 0.24 }] },
    goblin: { id: 'goblin', name: 'Лесной гоблин', hp: 58, damage: [7, 13], rewardGold: [12, 22], rewardExp: [20, 30], lootTable: [{ itemId: 'sword_novice', chance: 0.07 }, { itemId: 'potion_small', chance: 0.27 }] },
    skeleton: { id: 'skeleton', name: 'Костяной страж', hp: 76, damage: [10, 16], rewardGold: [18, 30], rewardExp: [26, 38], lootTable: [{ itemId: 'armor_leather', chance: 0.09 }, { itemId: 'potion_medium', chance: 0.19 }] },
    mine_beast: { id: 'mine_beast', name: 'Шахтный зверь', hp: 96, damage: [12, 18], rewardGold: [28, 42], rewardExp: [34, 52], lootTable: [{ itemId: 'bow_hunter', chance: 0.06 }, { itemId: 'potion_medium', chance: 0.24 }] },
    phantom_knight: { id: 'phantom_knight', name: 'Призрачный рыцарь', hp: 118, damage: [14, 23], rewardGold: [40, 58], rewardExp: [48, 70], lootTable: [{ itemId: 'staff_arcane', chance: 0.08 }, { itemId: 'gem_shadow', chance: 0.15 }] },
    abyss_horror: { id: 'abyss_horror', name: 'Бездна чудовища', hp: 160, damage: [18, 29], rewardGold: [60, 90], rewardExp: [70, 105], lootTable: [{ itemId: 'armor_king_guard', chance: 0.06 }, { itemId: 'gem_shadow', chance: 0.28 }] }
  };

  const LOCATIONS = [
    { id: 'dawn_village', name: 'Деревня Рассвета', icon: '🏘️', description: 'Безопасное поселение, где можно перевести дух.', minLevel: 1, background: 'linear-gradient(140deg, #221b2f 0%, #3b2e42 55%, #4f3b56 100%)', monsters: ['wolf'], chestChance: 0.15, hasMerchant: true },
    { id: 'dark_forest', name: 'Тёмный лес', icon: '🌲', description: 'Густая чаща и шёпот древних духов.', minLevel: 2, background: 'linear-gradient(140deg, #111d1a 0%, #1d3329 55%, #2e4b3f 100%)', monsters: ['wolf', 'goblin'], chestChance: 0.22, hasMerchant: false },
    { id: 'abandoned_mine', name: 'Заброшенная шахта', icon: '⛏️', description: 'Сырые тоннели скрывают опасных тварей.', minLevel: 3, background: 'linear-gradient(140deg, #151515 0%, #2c2a28 55%, #403a36 100%)', monsters: ['skeleton', 'mine_beast'], chestChance: 0.28, hasMerchant: true },
    { id: 'king_ruins', name: 'Руины короля', icon: '🏰', description: 'Осколки великой эпохи и проклятые стражи.', minLevel: 5, background: 'linear-gradient(140deg, #1f1526 0%, #302045 55%, #4a2b66 100%)', monsters: ['phantom_knight', 'skeleton'], chestChance: 0.35, hasMerchant: false },
    { id: 'monster_lair', name: 'Логово чудовища', icon: '🐉', description: 'Самое мрачное место, где выживают сильнейшие.', minLevel: 7, background: 'linear-gradient(140deg, #230f13 0%, #3f151f 55%, #632433 100%)', monsters: ['abyss_horror', 'phantom_knight'], chestChance: 0.44, hasMerchant: false }
  ];

  const CHESTS = {
    common: {
      gold: [12, 40],
      itemDrops: [
        { itemId: 'potion_small', chance: 0.45 },
        { itemId: 'sword_novice', chance: 0.18 },
        { itemId: 'armor_leather', chance: 0.14 }
      ]
    },
    rare: {
      gold: [40, 95],
      itemDrops: [
        { itemId: 'potion_medium', chance: 0.38 },
        { itemId: 'bow_hunter', chance: 0.12 },
        { itemId: 'staff_arcane', chance: 0.1 },
        { itemId: 'gem_shadow', chance: 0.15 }
      ]
    }
  };

  const MERCHANT_ITEMS = ['potion_small', 'potion_medium', 'sword_novice', 'armor_leather', 'staff_arcane', 'bow_hunter'];

  return { CLASSES, ITEMS, MONSTERS, LOCATIONS, CHESTS, MERCHANT_ITEMS };
})();
