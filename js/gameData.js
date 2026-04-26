// Данные игры: баланс, локации, предметы, монстры, сундуки.
window.GameData = (() => {
  const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];

  const CLASSES = {
    warrior: {
      id: 'warrior',
      name: 'Воин',
      icon: '⚔️',
      description: 'Много HP, средний урон, высокая защита.',
      baseStats: { maxHp: 145, minDamage: 10, maxDamage: 16, critChance: 0.08, defense: 5, energy: 100 }
    },
    mage: {
      id: 'mage',
      name: 'Маг',
      icon: '🔮',
      description: 'Меньше HP, сильная магическая атака.',
      baseStats: { maxHp: 105, minDamage: 13, maxDamage: 21, critChance: 0.1, defense: 2, energy: 120 }
    },
    archer: {
      id: 'archer',
      name: 'Лучник',
      icon: '🏹',
      description: 'Средний HP, повышенный шанс критического удара.',
      baseStats: { maxHp: 120, minDamage: 11, maxDamage: 18, critChance: 0.18, defense: 3, energy: 110 }
    }
  };

  const ITEMS = {
    potion_small: { id: 'potion_small', name: 'Малое зелье HP', type: 'potion', rarity: 'common', heal: 35, price: 25, icon: '🧪', description: 'Восстанавливает 35 HP.' },
    potion_medium: { id: 'potion_medium', name: 'Среднее зелье HP', type: 'potion', rarity: 'rare', heal: 70, price: 60, icon: '🧴', description: 'Восстанавливает 70 HP.' },
    potion_energy: { id: 'potion_energy', name: 'Зелье энергии', type: 'potion', rarity: 'rare', restoreEnergy: 35, price: 55, icon: '⚡', description: 'Восстанавливает 35 энергии.' },

    sword_novice: { id: 'sword_novice', name: 'Меч новичка', type: 'weapon', rarity: 'common', minDamageBonus: 2, maxDamageBonus: 4, price: 90, icon: '⚔️', description: 'Надёжный клинок для первых вылазок.' },
    staff_arcane: { id: 'staff_arcane', name: 'Магический посох', type: 'weapon', rarity: 'epic', minDamageBonus: 4, maxDamageBonus: 8, critChanceBonus: 0.03, price: 185, icon: '🔮', description: 'Сфокусированная магическая мощь.' },
    bow_hunter: { id: 'bow_hunter', name: 'Лук охотника', type: 'weapon', rarity: 'rare', minDamageBonus: 3, maxDamageBonus: 6, critChanceBonus: 0.06, price: 165, icon: '🏹', description: 'Повышает шанс критического попадания.' },

    armor_leather: { id: 'armor_leather', name: 'Кожаная броня', type: 'armor', rarity: 'common', maxHpBonus: 15, defenseBonus: 2, price: 80, icon: '🛡️', description: 'Лёгкая базовая защита.' },
    armor_king_guard: { id: 'armor_king_guard', name: 'Доспех стражи', type: 'armor', rarity: 'legendary', maxHpBonus: 36, defenseBonus: 5, price: 330, icon: '🛡️', description: 'Доспех королевской стражи.' },

    amulet_mist: { id: 'amulet_mist', name: 'Амулет Тумана', type: 'amulet', rarity: 'epic', critChanceBonus: 0.04, maxHpBonus: 10, price: 230, icon: '📿', description: 'Скрытая сила древних рун.' },
    ring_ember: { id: 'ring_ember', name: 'Кольцо Углей', type: 'ring', rarity: 'rare', minDamageBonus: 2, maxDamageBonus: 3, price: 170, icon: '💍', description: 'Подпитывает атаки жаром.' },

    gem_shadow: { id: 'gem_shadow', name: 'Теневая гемма', type: 'material', rarity: 'epic', price: 220, icon: '💎', description: 'Редкий ценный кристалл.' }
  };

  const MONSTERS = {
    wolf: { id: 'wolf', name: 'Голодный волк', hp: 48, damage: [6, 11], rewardGold: [8, 15], rewardExp: [14, 24], lootTable: [{ itemId: 'potion_small', chance: 0.24 }] },
    goblin: { id: 'goblin', name: 'Лесной гоблин', hp: 60, damage: [7, 13], rewardGold: [12, 22], rewardExp: [20, 30], lootTable: [{ itemId: 'sword_novice', chance: 0.08 }, { itemId: 'potion_small', chance: 0.25 }] },
    skeleton: { id: 'skeleton', name: 'Костяной страж', hp: 82, damage: [10, 16], rewardGold: [18, 30], rewardExp: [26, 40], lootTable: [{ itemId: 'armor_leather', chance: 0.09 }, { itemId: 'potion_medium', chance: 0.18 }] },
    mine_beast: { id: 'mine_beast', name: 'Шахтный зверь', hp: 98, damage: [12, 19], rewardGold: [28, 43], rewardExp: [34, 54], lootTable: [{ itemId: 'bow_hunter', chance: 0.07 }, { itemId: 'potion_medium', chance: 0.2 }] },
    phantom_knight: { id: 'phantom_knight', name: 'Призрачный рыцарь', hp: 124, damage: [14, 23], rewardGold: [40, 60], rewardExp: [48, 72], lootTable: [{ itemId: 'staff_arcane', chance: 0.08 }, { itemId: 'gem_shadow', chance: 0.15 }] },
    abyss_horror: { id: 'abyss_horror', name: 'Бездна чудовища', hp: 170, damage: [18, 30], rewardGold: [60, 95], rewardExp: [74, 108], lootTable: [{ itemId: 'armor_king_guard', chance: 0.06 }, { itemId: 'amulet_mist', chance: 0.09 }, { itemId: 'ring_ember', chance: 0.12 }] }
  };

  const LOCATIONS = [
    {
      id: 'dawn_village', name: 'Деревня Рассвета', icon: '🏘️', minLevel: 1,
      description: 'Тихое поселение на границе диких земель.',
      background: 'linear-gradient(145deg, #2a1d3a 0%, #4a345e 100%)',
      // Опционально заменить на URL фонового изображения: './assets/backgrounds/dawn.jpg'
      image: '',
      monsters: ['wolf'], chestChance: 0.16, hasMerchant: true
    },
    {
      id: 'dark_forest', name: 'Тёмный лес', icon: '🌲', minLevel: 2,
      description: 'Густая чаща, где шёпот ветра похож на голоса.',
      background: 'linear-gradient(145deg, #12251f 0%, #2f5b4e 100%)',
      image: '', monsters: ['wolf', 'goblin'], chestChance: 0.22, hasMerchant: false
    },
    {
      id: 'abandoned_mine', name: 'Заброшенная шахта', icon: '⛏️', minLevel: 3,
      description: 'Каменные тоннели и эхо забытых каторжников.',
      background: 'linear-gradient(145deg, #171718 0%, #3f3935 100%)',
      image: '', monsters: ['skeleton', 'mine_beast'], chestChance: 0.28, hasMerchant: true
    },
    {
      id: 'king_ruins', name: 'Руины короля', icon: '🏰', minLevel: 5,
      description: 'Осколки трона и тени древних стражей.',
      background: 'linear-gradient(145deg, #1e1532 0%, #4a2e63 100%)',
      image: '', monsters: ['phantom_knight', 'skeleton'], chestChance: 0.35, hasMerchant: false
    },
    {
      id: 'monster_lair', name: 'Логово чудовища', icon: '🐉', minLevel: 7,
      description: 'Сердце мрака, где рождаются легенды.',
      background: 'linear-gradient(145deg, #2b1016 0%, #652437 100%)',
      image: '', monsters: ['abyss_horror', 'phantom_knight'], chestChance: 0.45, hasMerchant: false
    }
  ];

  const CHESTS = {
    common: {
      gold: [14, 44],
      itemDrops: [
        { itemId: 'potion_small', chance: 0.45 },
        { itemId: 'potion_energy', chance: 0.2 },
        { itemId: 'sword_novice', chance: 0.17 },
        { itemId: 'armor_leather', chance: 0.12 }
      ]
    },
    rare: {
      gold: [42, 105],
      itemDrops: [
        { itemId: 'potion_medium', chance: 0.36 },
        { itemId: 'bow_hunter', chance: 0.13 },
        { itemId: 'staff_arcane', chance: 0.1 },
        { itemId: 'amulet_mist', chance: 0.1 },
        { itemId: 'gem_shadow', chance: 0.14 }
      ]
    }
  };

  const MERCHANT_ITEMS = ['potion_small', 'potion_medium', 'potion_energy', 'sword_novice', 'armor_leather', 'staff_arcane', 'bow_hunter', 'ring_ember'];

  return { RARITY_ORDER, CLASSES, ITEMS, MONSTERS, LOCATIONS, CHESTS, MERCHANT_ITEMS };
})();
