// gameApi.js

const gameApi = {
  startGame() {
    return new Promise(resolve => {
      setTimeout(() => {
        const suits = ['♠', '♥', '♣', '♦'];
        const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        let deck = suits.flatMap(suit => values.map(value => ({ suit, value })));
        // 添加大小王
        deck.push({ suit: 'Joker', value: 'Small' }, { suit: 'Joker', value: 'Big' });
        const shuffled = deck.sort(() => Math.random() - 0.5);
        resolve([
          shuffled.slice(0, 17),
          shuffled.slice(17, 34),
          shuffled.slice(34)
        ]);
      }, 1000);
    });
  },

  playCards(cards, lastPlayedCards) {
    return new Promise(resolve => {
      setTimeout(() => {
        const valid = validateCardPattern(cards);
        const greater = lastPlayedCards ? isGreaterThanLastPlay(cards, lastPlayedCards) : true;
        const winner = cards.length === 0 ? null : (valid && greater);
        resolve({ valid, greater, winner });
      }, 500);
    });
  }
};

export default gameApi;

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

  // 三带一或三带二
  if (cards.length === 4 || cards.length === 5) {
    const valueCounts = {};
    cards.forEach(card => {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    });
    const counts = Object.values(valueCounts);
    return counts.includes(3) && (counts.includes(1) || counts.includes(2));
  }

  // 炸弹
  if (cards.length === 4 && new Set(cards.map(c => c.value)).size === 1) return true;
  if (cards.length === 2 && cards[0].suit === 'Joker' && cards[1].suit === 'Joker') return true;

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

  // 连对
  if (cards.length >= 6 && cards.length % 2 === 0) {
    const values = cards.map(c => c.value);
    if (values.includes('2') || values.includes('Small') || values.includes('Big')) return false;
    for (let i = 0; i < values.length; i += 2) {
      if (values[i] !== values[i+1]) return false;
      if (i > 0 && cardOrder.indexOf(values[i]) - cardOrder.indexOf(values[i-2]) !== 1) return false;
    }
    return true;
  }

  return false;
}

export function isGreaterThanLastPlay(currentCards, lastPlayedCards) {
  if (currentCards.length !== lastPlayedCards.length) {
    // 炸弹可以打任何牌
    if (currentCards.length === 4 && new Set(currentCards.map(c => c.value)).size === 1) return true;
    if (currentCards.length === 2 && currentCards[0].suit === 'Joker' && currentCards[1].suit === 'Joker') return true;
    return false;
  }

  // 比较相同类型的牌
  return compareCards(currentCards[0], lastPlayedCards[0]) > 0;
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