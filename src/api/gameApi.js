// gameApi.js


// 辅助函数

const cardOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'Small', 'Big'];

function compareCards(a, b) {
  return cardOrder.indexOf(a.value) - cardOrder.indexOf(b.value);
}

export function validateCardPattern(cards) {
  if (cards.length === 0) return false;
  
  // 对牌进行排序
  cards.sort((a, b) => compareCards(b, a));

  // 单牌
  if (cards.length === 1) return true;

  // 对牌
  if (cards.length === 2 && cards[0].value === cards[1].value) return true;

  // 三张
  if (cards.length === 3 && cards[0].value === cards[1].value && cards[1].value === cards[2].value) return true;


  if (isConsecutivePairs(cards)) return true;

    // 三带一或三带二
  if (cards.length === 4 || cards.length === 5) {
    const valueCounts = {};
    cards.forEach(card => {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    });
    const counts = Object.values(valueCounts);
    if (counts.includes(3) && (counts.includes(1) || counts.includes(2))) {
      return true;
    }
  }

  // 炸弹
  if (cards.length === 4 && new Set(cards.map(c => c.value)).size === 1) return true;
  if (cards.length === 2 && cards.some(c => c.value === 'Small') && cards.some(c => c.value === 'Big')) return true;

  // 四带三
  if (cards.length === 7) {
    const valueCounts = {};
    cards.forEach(card => {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    });
    return Object.values(valueCounts).includes(4);
  }

  // 顺子
  if (cards.length >= 5) {
    const values = cards.map(c => c.value);
    if (values.includes('2') || values.includes('Small') || values.includes('Big')) return false;
    for (let i = 1; i < values.length; i++) {
      if (cardOrder.indexOf(values[i]) - cardOrder.indexOf(values[i-1]) !== 1) return false;
    }
    return true;
  }


  

  return false;
}

function isConsecutivePairs(cards) {
  if (cards.length < 4 || cards.length % 2 !== 0) return false;

  const values = cards.map(c => c.value);
  
  // 检查是否包含不允许的牌值（2, Small, Big）
  if (values.some(v => v === '2' || v === 'Small' || v === 'Big')) return false;

  // 检查是否都是对子
  for (let i = 0; i < values.length; i += 2) {
    if (values[i] !== values[i + 1]) return false;
  }

  // 获取对子的值
  const pairValues = values.filter((_, index) => index % 2 === 0);
  
  // 检查对子是否连续
  for (let i = 1; i < pairValues.length; i++) {
    const currentIndex = cardOrder.indexOf(pairValues[i]);
    const previousIndex = cardOrder.indexOf(pairValues[i - 1]);
    
    // 检查是否连续且不超过 A
    if (previousIndex - currentIndex !== 1 || currentIndex > cardOrder.indexOf('A')) {
      return false;
    }
  }

  return true;
}

export function isGreaterThanLastPlay(currentCards, lastPlayedCards) {
  // 如果没有上家出牌，玩家可以任意出牌
  if (!lastPlayedCards || lastPlayedCards.length === 0) {
    return true;
  }

  // 确保出牌数量相同（除了炸弹的情况）
  if (currentCards.length !== lastPlayedCards.length) {
    // 检查是否为炸弹
    if (isValidBomb(currentCards)) {
      return true; // 炸弹可以打任何牌
    }
    return false; // 不同数量的牌不能比较（除非是炸弹）
  }

  // 检查炸弹
  if (isValidBomb(currentCards)) {
    if (isValidBomb(lastPlayedCards)) {
      // 比较两个炸弹的大小
      return compareBombs(currentCards, lastPlayedCards);
    }
    return true; // 当前是炸弹，上家不是炸弹
  }

  // 根据牌型进行比较
  switch (currentCards.length) {
    case 1:
      return compareSingleCard(currentCards[0], lastPlayedCards[0]);
    case 2:
      return comparePair(currentCards, lastPlayedCards);
    case 3:
      return compareTriple(currentCards, lastPlayedCards);
    case 4:
    case 5:
      return compareTriplePlusCards(currentCards, lastPlayedCards);
    default:
      return compareStraight(currentCards, lastPlayedCards);
  }
}

// 辅助函数

function isValidBomb(cards) {
  if (cards.length === 4 && new Set(cards.map(c => c.value)).size === 1) return true;
  if (cards.length === 2 && cards[0].value === 'Small' && cards[1].value === 'Big') return true;
  return false;
}

function compareBombs(bomb1, bomb2) {
  // 王炸最大
  if (bomb1.length === 2) return true;
  if (bomb2.length === 2) return false;
  // 比较普通炸弹
  return cardOrder.indexOf(bomb1[0].value) > cardOrder.indexOf(bomb2[0].value);
}

function compareSingleCard(card1, card2) {
  return compareCards(card1, card2) > 0;
}

function comparePair(pair1, pair2) {
  return compareCards(pair1[0], pair2[0]) > 0;
}

function compareTriple(triple1, triple2) {
  return compareCards(triple1[0], triple2[0]) > 0;
}

function compareTriplePlusCards(cards1, cards2) {
  // 只比较三张的部分
  const triple1 = cards1.slice(0, 3);
  const triple2 = cards2.slice(0, 3);
  return compareTriple(triple1, triple2);
}

function compareStraight(straight1, straight2) {
  // 比较顺子的第一张牌
  return compareCards(straight1[0], straight2[0]) > 0;
}



export function canPass(playerCards, lastPlayedCards) {
  // 如果没有上家出的牌，不能过
  if (!lastPlayedCards || lastPlayedCards.length === 0) return false;

  // 检查玩家是否有大于上家的牌
  for (let i = 1; i <= playerCards.length; i++) {
    const combinations = getCombinations(playerCards, i);
    for (const combo of combinations) {
      if (validateCardPattern(combo) && isGreaterThanLastPlay(combo, lastPlayedCards)) {
        return false; // 有大于上家的牌，不能过
      }
    }
  }

  return true; // 没有大于上家的牌，可以过
}

// 辅助函数：获取所有可能的牌组合
function getCombinations(cards, k) {
  if (k > cards.length || k <= 0) {
    return [];
  }

  if (k === cards.length) {
    return [cards];
  }

  if (k === 1) {
    return cards.map(card => [card]);
  }

  // const combinations = [];
  const firstCard = cards[0];
  const remainingCards = cards.slice(1);

  const combosWithFirst = getCombinations(remainingCards, k - 1).map(combo => [firstCard, ...combo]);
  const combosWithoutFirst = getCombinations(remainingCards, k);

  return [...combosWithFirst, ...combosWithoutFirst];
}