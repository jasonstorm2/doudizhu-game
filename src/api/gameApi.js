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

  // 2张牌的情况
  if (cards.length === 2) {
    // 大小王炸弹
    if (cards[0].value === 'Big' && cards[1].value === 'Small') return true;
    // 对子
    if (cards[0].value === cards[1].value) return true;
    return false;
  }

  // 3张牌的情况（三张）
  if (cards.length === 3 && cards[0].value === cards[1].value && cards[1].value === cards[2].value) return true;

  // 4张或以上的牌
  if (cards.length >= 4) {
    // 炸弹（4张相同的牌）
    if (cards.length === 4 && new Set(cards.map(c => c.value)).size === 1) return true;

    // 连对
    if (isConsecutivePairs(cards)) return true;

    // 三带一或三带二
    if (cards.length === 4 || cards.length === 5) {
      if (isTriplePlusCards(cards)) return true;
    }

    // 顺子
    // 顺子
    if (isStraight(cards)) return true;

    // 飞机（连续的三带一或三带二）
    if (isPlane(cards)) return true;
  }

  return false;
}

//是连续对
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

function isTriplePlusCards(cards) {
  const valueCounts = {};
  cards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });
  const counts = Object.values(valueCounts);
  return counts.includes(3) && (counts.includes(1) || counts.includes(2));
}

function isStraight(cards) {
  if (cards.length < 5) return false;
  const values = cards.map(c => c.value);
  if (values.includes('2') || values.includes('Small') || values.includes('Big')) return false;
  for (let i = 1; i < values.length; i++) {
    if (cardOrder.indexOf(values[i-1]) - cardOrder.indexOf(values[i]) !== 1) return false;
  }
  return true;
}

function isPlane(cards) {
  const valueCounts = {};
  cards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });
  
  const triples = Object.entries(valueCounts).filter(([, count]) => count === 3).map(([value]) => value);
  if (triples.length < 2) return false;

  // 检查三张是否连续
  triples.sort((a, b) => cardOrder.indexOf(b) - cardOrder.indexOf(a));
  for (let i = 1; i < triples.length; i++) {
    if (cardOrder.indexOf(triples[i-1]) - cardOrder.indexOf(triples[i]) !== 1) return false;
  }

  // 检查剩余的牌是否符合要求（单牌或对子）
  const remainingCards = cards.length - triples.length * 3;
  return remainingCards === 0 || remainingCards === triples.length || remainingCards === triples.length * 2;
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
  const currentPattern = getCardPattern(currentCards);
  const lastPattern = getCardPattern(lastPlayedCards);

  if (currentPattern !== lastPattern) {
    return false; // 不同牌型不能比较
  }

  switch (currentPattern) {
    case 'single':
      return compareSingleCard(currentCards[0], lastPlayedCards[0]);
    case 'pair':
      return comparePair(currentCards, lastPlayedCards);
    case 'triple':
      return compareTriple(currentCards, lastPlayedCards);
    case 'triplePlusOne':
    case 'triplePlusTwo':
      return compareTriplePlusCards(currentCards, lastPlayedCards);
    case 'straight':
      return compareStraight(currentCards, lastPlayedCards);
    case 'consecutivePairs':
      return compareConsecutivePairs(currentCards, lastPlayedCards);
    case 'plane':
      return comparePlane(currentCards, lastPlayedCards);
    case 'bomb':
      return compareBombs(currentCards, lastPlayedCards);
    default:
      return false;
  }
}

function compareConsecutivePairs(pairs1, pairs2) {
  // 连对的比较只需要比较第一对
  return compareCards(pairs1[0], pairs2[0]) > 0;
}

function comparePlane(plane1, plane2) {
  // 获取飞机的三张部分
  const getTriples = (cards) => {
    const valueCounts = {};
    cards.forEach(card => {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    });
    return Object.entries(valueCounts)
      .filter(([, count]) => count === 3)
      .map(([value]) => value)
      .sort((a, b) => cardOrder.indexOf(b) - cardOrder.indexOf(a));
  };

  const triples1 = getTriples(plane1);
  const triples2 = getTriples(plane2);

  // 确保两个牌组都是有效的飞机（至少有两个连续的三张）
  if (triples1.length < 2 || triples2.length < 2) {
    return false;
  }

  // 检查三张是否连续
  const isConsecutive = (triples) => {
    for (let i = 1; i < triples.length; i++) {
      if (cardOrder.indexOf(triples[i-1]) - cardOrder.indexOf(triples[i]) !== 1) {
        return false;
      }
    }
    return true;
  };

  if (!isConsecutive(triples1) || !isConsecutive(triples2)) {
    return false;
  }

  // 比较第一个三张
  return cardOrder.indexOf(triples1[0]) > cardOrder.indexOf(triples2[0]);
}

function getCardPattern(cards) {
  if (cards.length === 1) return 'single';
  if (cards.length === 2 && cards[0].value === cards[1].value) return 'pair';
  if (cards.length === 3 && cards[0].value === cards[1].value && cards[1].value === cards[2].value) return 'triple';
  if (cards.length === 4 && isTriplePlusCards(cards)) return 'triplePlusOne';
  if (cards.length === 5 && isTriplePlusCards(cards)) return 'triplePlusTwo';
  if (isStraight(cards)) return 'straight';
  if (isConsecutivePairs(cards)) return 'consecutivePairs';
  if (isPlane(cards)) return 'plane';
  if (isValidBomb(cards)) return 'bomb';
  return 'unknown';
}
// 辅助函数

function isValidBomb(cards) {
  if (cards.length === 4 && new Set(cards.map(c => c.value)).size === 1) return true;
  if (cards.length === 2 && cards[0].value === 'Big' && cards[1].value === 'Small') return true;

  console.table(cards.map(card => ({
    value: card.value,
    suit: card.suit,
    display: `${card.value}${card.suit}`
  })));
  console.log("运行到这里1");
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



export function canPass(playerCards, lastPlayedCards, isFirstPlayer) {
  // 如果是这一小轮首发，不能过牌
  if (isFirstPlayer) return false;

  // 如果没有上家出的牌（新的一小局），不能过
  if (!lastPlayedCards || lastPlayedCards.length === 0) return false;

  // 检查玩家是否有大小王炸
  if (hasJokerBomb(playerCards)) return false;

  // 检查玩家是否有普通炸弹
  const normalBomb = hasNormalBomb(playerCards);
  if (normalBomb) {
    // 如果上家出的是炸弹，检查玩家的炸弹是否更大
    if (isValidBomb(lastPlayedCards)) {
      if (compareBombs(normalBomb, lastPlayedCards)) return false;
    } else {
      // 如果上家出的不是炸弹，玩家不能过
      return false;
    }
  }

  // 检查玩家是否有大于上家的牌
  const lastPattern = getCardPattern(lastPlayedCards);
  for (let i = 1; i <= playerCards.length; i++) {
    const combinations = getCombinations(playerCards, i);
    for (const combo of combinations) {
      if (validateCardPattern(combo) && getCardPattern(combo) === lastPattern && isGreaterThanLastPlay(combo, lastPlayedCards)) {
        return false; // 有大于上家的牌，不能过
      }
    }
  }

  return true; // 没有大于上家的牌，可以过牌
}

function hasJokerBomb(cards) {
  return cards.some(card => card.value === 'Small') && cards.some(card => card.value === 'Big');
}

function hasNormalBomb(cards) {
  for (let i = 0; i < cards.length - 3; i++) {
    if (cards[i].value === cards[i+1].value && cards[i].value === cards[i+2].value && cards[i].value === cards[i+3].value) {
      return [cards[i], cards[i+1], cards[i+2], cards[i+3]];
    }
  }
  return null;
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

export function hasGreaterCards(playerCards, lastPlayedCards) {
  if (!lastPlayedCards || lastPlayedCards.length === 0) return true;

  for (let i = 1; i <= playerCards.length; i++) {
    const combinations = getCombinations(playerCards, i);
    for (const combo of combinations) {
      if (validateCardPattern(combo) && isGreaterThanLastPlay(combo, lastPlayedCards)) {
        return true;
      }
    }
  }

  return false;
}