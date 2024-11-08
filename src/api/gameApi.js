// gameApi.js

// 定义角色枚举
const PlayerType = {
  AI: 'AI',
  HUMAN: 'HUMAN',
  PROGRAM: 'PROGRAM'
};

// 打牌函数
function playCard(playerType) {
  switch (playerType) {
    case PlayerType.AI:
      return playAICard();
    case PlayerType.HUMAN:
      return playHumanCard();
    case PlayerType.PROGRAM:
      return playProgramCard();
    default:
      throw new Error('Unknown player type');
  }
}

// AI打牌逻辑
function playAICard() {
  // AI打牌的具体实现
  console.log('AI is playing a card');
}

// 人类玩家打牌逻辑
function playHumanCard() {
  // 人类玩家打牌的具体实现
  console.log('Human is playing a card');
}

// 程序打牌逻辑
function playProgramCard() {
  // 程序打牌的具体实现
  console.log('Program is playing a card');
}

// 导出函数和枚举
export { PlayerType, playCard };

// 辅助函数

const cardOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'Small', 'Big'];


//给玩家的手牌排序
export function compareHandCards(a, b) {
  const order = ['Big', 'Small', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3'];
  if (a.suit === 'Joker' && b.suit === 'Joker') {
    return order.indexOf(a.value) - order.indexOf(b.value);
  }
  if (a.suit === 'Joker') return -1;
  if (b.suit === 'Joker') return 1;
  return order.indexOf(a.value) - order.indexOf(b.value);
}

function compareCards(a, b) {
  return cardOrder.indexOf(a.value) - cardOrder.indexOf(b.value);
}
//牌型是否正确
export function validateCardPattern(cards, throwError = true) {
  if (cards.length === 0) {
    if (throwError) throw new Error('请选择要出的牌');
    return false;
  }

  cards = sortCards(cards);

  if (cards.length === 1) return true; // 单牌
  if (cards.length === 2) {
    if (cards[0].value === 'Big' && cards[1].value === 'Small') return true; // 王炸
    if (cards[0].value === cards[1].value) return true; // 对子
    if (throwError) throw new Error('无效的对子');
    return false;
  }
  if (cards.length === 3) {
    if (cards[0].value === cards[1].value && cards[1].value === cards[2].value) return true; // 三张
    if (throwError) throw new Error('无效的三张');
    return false;
  }
  if (cards.length === 4) {
    if (new Set(cards.map(c => c.value)).size === 1) return true; // 炸弹
    if (isTriplePlusCards(cards)) return true; // 三带一
    if (isConsecutivePairs(cards)) return true; // 连对
    if (throwError) throw new Error('无效的四张牌组合');
    return false;
  }
  if (cards.length === 5) {
    if (isTriplePlusCards(cards)) return true; // 三带二
    if (isStraight(cards)) return true; // 顺子
    if (throwError) throw new Error('无效的五张牌组合');
    return false;
  }
  if (cards.length > 5) {
    if (isConsecutivePairs(cards)) return true; // 连对
    if (isStraight(cards)) return true; // 顺子
    if (isPlane(cards)) return true; // 飞机
    if (throwError) throw new Error('无效的多张牌组合');
    return false;
  }

  if (throwError) throw new Error('无效的牌型');
  return false;
}

/**
 * 获取牌型
 * @param {*} cards 
 * @returns 
 */
export function getCardPatternType(cards) {
  cards = flattenArray(cards);
  const sortedCards = sortCards([...cards]);
  const values = sortedCards.map(card => card.value);
  const uniqueValues = [...new Set(values)];


  if (cards.length == 2 && values.includes('Big') && values.includes('Small')) {
    return 'rocket';
  }


  if (values.length === 1) return 'single';
  if (values.length === 2 && uniqueValues.length === 1) return 'pair';
  if (values.length === 3 && uniqueValues.length === 1) return 'triple';
  if (values.length === 4) {
    if (uniqueValues.length === 1) return 'bomb';
    if (isTriplePlusCards(sortedCards)) return 'tripleWithOne';
    if (isConsecutivePairs(sortedCards)) return 'consecutivePairs';
  }
  if (values.length === 5) {
    if (isTriplePlusCards(sortedCards)) return 'tripleWithTwo';
    if (isStraight(sortedCards)) return 'straight';
  }
  if (values.length >= 6) {
    if (isConsecutivePairs(sortedCards)) return 'consecutivePairs';
    if (isStraight(sortedCards)) return 'straight';
    if (isPlaneWithNone(sortedCards)) return 'planeWithNone';
    if (isPlaneWithOne(sortedCards)) return 'planeWithOne';
    if (isPlaneWithTwo(sortedCards)) return 'planeWithTwo';
  }
  return null;
}

function isTriplePlusCards(cards) {
  const valueCounts = {};
  cards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });
  const counts = Object.values(valueCounts);
  return counts.includes(3) && (counts.includes(1) || counts.includes(2));
}

export function isConsecutivePairs(cards) {
  if (cards.length % 2 !== 0 || cards.length < 4) return false;

  const cardOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const pairs = [];

  // 检查是否都是对子
  for (let i = 0; i < cards.length; i += 2) {
    if (cards[i].value !== cards[i + 1].value) return false;
    pairs.push(cards[i].value);
  }

  // 特殊情况：KK AA
  if (pairs.length === 2 && pairs[0] === 'K' && pairs[1] === 'A') return true;

  // 检查对子是否连续
  for (let i = 1; i < pairs.length; i++) {
    const currentIndex = cardOrder.indexOf(pairs[i]);
    const previousIndex = cardOrder.indexOf(pairs[i - 1]);
    if (currentIndex !== previousIndex - 1) return false;
  }

  return true;
}

// 判断是否是有效的三带二
function isValidTrioWithPair(cards) {
  if (cards.length !== 5) return false;

  const [a, b, c, d, e] = cards;
  return (a.value === b.value && b.value === c.value && d.value === e.value);
}

//判断是否是顺子
function isStraight(cards) {
  if (cards.length < 5) return false;
  const values = cards.map(c => c.value);
  if (values.includes('2') || values.includes('Small') || values.includes('Big')) return false;
  for (let i = 1; i < values.length; i++) {
    if (cardOrder.indexOf(values[i - 1]) - cardOrder.indexOf(values[i]) !== 1) return false;
  }
  return true;
}

function isPlane(cards) {
  const valueCounts = {};
  cards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });

  const triples = Object.entries(valueCounts).filter(([, count]) => count >= 3).map(([value]) => value);
  if (triples.length < 2) return false;

  // 检查三张是否连续
  triples.sort((a, b) => cardOrder.indexOf(b) - cardOrder.indexOf(a));
  for (let i = 1; i < triples.length; i++) {
    if (cardOrder.indexOf(triples[i - 1]) - cardOrder.indexOf(triples[i]) !== 1) return false;
  }

  // 检查剩余的牌是否符合要求
  const remainingCards = cards.length - triples.length * 3;
  return remainingCards === 0 || remainingCards === triples.length || remainingCards === triples.length * 2;
}

export function isPlaneWithNone(cards) {
  const valueCounts = {};
  cards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });

  const triples = Object.entries(valueCounts).filter(([, count]) => count >= 3).map(([value]) => value);
  if (triples.length < 2) return false;

  // 检查三张是否连续
  triples.sort((a, b) => cardOrder.indexOf(b) - cardOrder.indexOf(a));
  for (let i = 1; i < triples.length; i++) {
    if (cardOrder.indexOf(triples[i - 1]) - cardOrder.indexOf(triples[i]) !== 1) return false;
  }

  // 检查剩余的牌是否符合要求
  const remainingCards = cards.length - triples.length * 3;
  return remainingCards === 0;
}

export function isPlaneWithOne(cards) {
  const valueCounts = {};
  cards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });

  const triples = Object.entries(valueCounts).filter(([, count]) => count >= 3).map(([value]) => value);
  if (triples.length < 2) return false;

  // 检查三张是否连续
  triples.sort((a, b) => cardOrder.indexOf(b) - cardOrder.indexOf(a));
  for (let i = 1; i < triples.length; i++) {
    if (cardOrder.indexOf(triples[i - 1]) - cardOrder.indexOf(triples[i]) !== 1) return false;
  }

  // 检查剩余的牌是否符合要求
  const remainingCards = cards.length - triples.length * 3;
  return remainingCards === 2;
}

export function isPlaneWithTwo(cards) {
  const valueCounts = {};
  cards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });

  const triples = Object.entries(valueCounts).filter(([, count]) => count >= 3).map(([value]) => value);
  if (triples.length < 2) return false;

  // 检查三张是否连续
  triples.sort((a, b) => cardOrder.indexOf(b) - cardOrder.indexOf(a));
  for (let i = 1; i < triples.length; i++) {
    if (cardOrder.indexOf(triples[i - 1]) - cardOrder.indexOf(triples[i]) !== 1) return false;
  }

  // 检查剩余的牌是否符合要求
  const remainingCards = cards.length - triples.length * 3;
  return remainingCards === 4;
}

export function isGreaterThanLastPlay(currentCards, lastPlayedCards) {
  // 如果没有上家出牌，玩家可以任意出牌
  if (!lastPlayedCards || lastPlayedCards.length === 0) {
    return true;
  }

  // 确保出牌数量相同（除了炸弹的情况
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
  const currentPattern = getCardPatternType(currentCards);
  const lastPattern = getCardPatternType(lastPlayedCards);

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
    case 'tripleWithOne':
    case 'tripleWithTwo':
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
  // 连对的比较需要比第一对
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
      .filter(([, count]) => count >= 3)
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
      if (cardOrder.indexOf(triples[i - 1]) - cardOrder.indexOf(triples[i]) !== 1) {
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

function compareTriplePlusCards(current, last) {
  // 只比较三张的部分
  const main1 = cardOrder.indexOf(getMainValue(current));
  const main2 = cardOrder.indexOf(getMainValue(last));
  return main1 - main2 > 0;
}

function getMainValue(cards) {
  if (cards.length < 3) {
    throw new Error("输入牌数量不足");
  }

  // 创建一个对象来计数每个值出现的次数
  const valueCounts = {};
  for (const card of cards) {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  }

  // 找到出现次数最多的值
  let maxCount = 0;
  let mainValue = null;
  for (const [value, count] of Object.entries(valueCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mainValue = value;
    }
  }

  // 检查主要部分是至少有3张牌
  if (maxCount < 3) {
    throw new Error("没有找到有效的主要部分（至少3张相同的牌）");
  }

  return mainValue;
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

  return !hasGreaterCards(playerCards, lastPlayedCards);
}

function hasJokerBomb(cards) {
  return cards.some(card => card.value === 'Small') && cards.some(card => card.value === 'Big');
}

function hasNormalBomb(cards) {
  for (let i = 0; i < cards.length - 3; i++) {
    if (cards[i].value === cards[i + 1].value && cards[i].value === cards[i + 2].value && cards[i].value === cards[i + 3].value) {
      return [cards[i], cards[i + 1], cards[i + 2], cards[i + 3]];
    }
  }
  return null;
}


// 检查玩家是否有大于上家的牌
function hasGreaterCards(playerCards, lastPlayedCards) {
  if (!Array.isArray(lastPlayedCards) || lastPlayedCards.length === 0) {
    console.error('Invalid lastPlayedCards:', lastPlayedCards);
    return false;
  }
  const lastCardType = getCardPatternType(lastPlayedCards);
  let res = false;
  switch (lastCardType) {
    case 'single':
      res = hasBiggerSingle(playerCards, lastPlayedCards[0]);
      return res;
    case 'pair':
      return hasBiggerPair(playerCards, lastPlayedCards);
    case 'triple':
      return hasBiggeTriple(playerCards, lastPlayedCards);
    case 'tripleWithOne':
      return hasBiggerTrioWithSingle(playerCards, lastPlayedCards);
    case 'tripleWithTwo':
      return hasBiggerTrioWithPair(playerCards, lastPlayedCards);
    case 'straight':
      return hasBiggerStraight(playerCards, lastPlayedCards);
    case 'consecutivePairs':
      return hasBiggerConsecutivePairs(playerCards, lastPlayedCards);
    case 'plane':
      return hasBiggerPlane(playerCards, lastPlayedCards);
    default:
      return false;
  }

  function hasBiggerPlane(playerCards, lastPlane) {
    // 获取上家飞机的信息
    const lastPlaneInfo = getPlaneInfo(lastPlane);
    if (!lastPlaneInfo) return false; // 如果上家出的不是有效的飞机,返回false

    // 找出玩家手牌中所有可能的飞机
    const possiblePlanes = findAllPossiblePlanes(playerCards, lastPlaneInfo.trioCount, lastPlaneInfo.attachmentType);

    // 检查是否有任何飞机大于上家的飞机
    return possiblePlanes.some(plane => comparePlanes(plane, lastPlane) > 0);
  }

  function comparePlanes(plane1, plane2) {
    // 比较两个飞机的最大三张
    return compareCards(plane1[0], plane2[0]);
  }

  function getPlaneInfo(plane) {
    const trioCount = countConsecutiveTrios(plane);
    if (trioCount < 2) return null; // 至少需要两个连续的三张才构成飞机

    const trioCards = plane.slice(0, trioCount * 3);
    const attachments = plane.slice(trioCount * 3);

    let attachmentType;
    if (attachments.length === trioCount) {
      attachmentType = 'single';
    } else if (attachments.length === trioCount * 2 && isAllPairs(attachments)) {
      attachmentType = 'pair';
    } else {
      return null; // 无效的飞机
    }

    return { trioCount, attachmentType, trioValue: trioCards[0].value };
  }

  function countConsecutiveTrios(cards) {
    let count = 0;
    for (let i = 0; i < cards.length - 2; i += 3) {
      if (cards[i].value === cards[i + 1].value && cards[i].value === cards[i + 2].value) {
        count++;
        if (i + 3 < cards.length - 2) {
          if (cardOrder.indexOf(cards[i + 3].value) !== cardOrder.indexOf(cards[i].value) + 1) {
            break;
          }
        }
      } else {
        break;
      }
    }
    return count;
  }

  function isAllPairs(cards) {
    for (let i = 0; i < cards.length; i += 2) {
      if (cards[i].value !== cards[i + 1].value) {
        return false;
      }
    }
    return true;
  }
  function findAllPossiblePlanes(cards, trioCount, attachmentType) {
    const planes = [];
    const requiredLength = attachmentType === 'single' ? trioCount * 4 : trioCount * 5;

    for (let i = 0; i <= cards.length - requiredLength; i++) {
      const potentialPlane = cards.slice(i, i + requiredLength);
      if (isValidPlane(potentialPlane, trioCount, attachmentType)) {
        planes.push(potentialPlane);
      }
    }

    return planes;
  }

  function isValidPlane(cards, trioCount, attachmentType) {
    // 检查三张部分
    for (let i = 0; i < trioCount; i++) {
      const trioStart = i * 3;
      if (cards[trioStart].value !== cards[trioStart + 1].value ||
        cards[trioStart].value !== cards[trioStart + 2].value) {
        return false;
      }

      // 检三张是否连续(除了最后一组)
      if (i < trioCount - 1) {
        const currentTrioIndex = cardOrder.indexOf(cards[trioStart].value);
        const nextTrioIndex = cardOrder.indexOf(cards[trioStart + 3].value);
        if (nextTrioIndex !== currentTrioIndex + 1 || nextTrioIndex >= cardOrder.indexOf('2')) {
          return false;
        }
      }
    }

    // 检查带的牌
    const attachments = cards.slice(trioCount * 3);
    if (attachmentType === 'single') {
      return attachments.length === trioCount;
    } else if (attachmentType === 'pair') {
      return attachments.length === trioCount * 2 && isAllPairs(attachments);
    }

    return false;
  }


  //是否大于上家的连对
  function hasBiggerConsecutivePairs(playerCards, lastConsecutivePairs) {
    // 获取上家连对的长度(对子的数量)和最大对子
    const pairsCount = lastConsecutivePairs.length / 2;
    const lastMaxPair = lastConsecutivePairs.slice(0, 2);  // 假设lastConsecutivePairs已经排序,前两张是最大的对子

    // 找出玩家手牌中所有可能的连对
    const possibleConsecutivePairs = findAllPossibleConsecutivePairs(playerCards, pairsCount);

    // 检查是否有任何连对大于上家的连对
    return possibleConsecutivePairs.some(consecutivePair =>
      compareCards(consecutivePair[0], lastMaxPair[0]) > 0
    );
  }

  function findAllPossibleConsecutivePairs(cards, pairsCount) {
    const consecutivePairs = [];

    for (let i = 0; i <= cards.length - pairsCount * 2; i++) {
      const potentialConsecutivePairs = cards.slice(i, i + pairsCount * 2);
      if (isConsecutivePairs(potentialConsecutivePairs)) {
        consecutivePairs.push(potentialConsecutivePairs);
      }
    }

    return consecutivePairs;
  }



 

  //是否有更大的顺子
  function hasBiggerStraight(playerCards, lastStraight) {
    // 获取上家顺子的长度和最大牌
    const straightLength = lastStraight.length;
    const lastMaxCard = lastStraight[0];  // 假设lastStraight已经排序,第一张是最大的

    // 找出玩家手牌中所有可能的顺子
    const possibleStraights = findAllPossibleStraights(playerCards, straightLength);

    // 检查是否有任何顺子大于上家的顺子
    return possibleStraights.some(straight => compareCards(straight[0], lastMaxCard) > 0);
  }

  function findAllPossibleStraights(cards, length) {
    const straights = [];
    const uniqueValues = [...new Set(cards.map(card => card.value))];
    const uniqueCards = uniqueValues.map(value => cards.find(card => card.value === value));

    for (let i = 0; i <= uniqueCards.length - length; i++) {
      const potentialStraight = uniqueCards.slice(i, i + length);
      if (isStraight(potentialStraight)) {
        // 找到原始手牌中对应的牌
        const originalStraight = potentialStraight.map(card =>
          cards.find(c => c.value === card.value && c.suit === card.suit)
        );
        straights.push(originalStraight);
      }
    }

    return straights;
  }



  // 以下是各种牌型的具体判断函数
  function hasBiggerSingle(playerCards, lastCard) {
    return playerCards.some(card => compareCards(card, lastCard) > 0);
  }

  // 判断是否有更大的对
  function hasBiggerPair(playerCards, lastPair) {
    const pairs = findPairs(playerCards);
    if (pairs.length === 0) {
      return false;
    }

    return pairs.some(pair => compareCards(pair[0], lastPair[0]) > 0);
  }

  // 判断是否有更大的对
  function hasBiggeTriple(playerCards, lastPair) {
    const triple = findTriples(playerCards);
    return triple.some(pair => compareCards(pair[0], lastPair[0]) > 0);
  }


  function findPairs(cards) {
    const pairs = [];
    // 首先检查cards是否至少有两张牌
    if (cards.length < 2) {
      return pairs; // 如果少于两张牌，直接返回空数组
    }

    for (let i = 0; i < cards.length - 1; i++) {
      // 如果当前卡牌和下一张卡牌相同，则为一对
      if (cards[i].value === cards[i + 1].value) {
        pairs.push([cards[i], cards[i + 1]]);
        // 跳过下一张卡牌，因为它已经被配对了
        i++;
      }
    }
    return pairs;
  }

  //发现三张同样的牌
  function findTriples(cards) {
    const triples = [];
    const sortedCards = sortCards([...cards]);
    for (let i = 0; i <= sortedCards.length - 3; i++) {
      if (sortedCards[i].value === sortedCards[i + 1].value && sortedCards[i].value === sortedCards[i + 2].value) {
        triples.push([sortedCards[i], sortedCards[i + 1], sortedCards[i + 2]]);
        i += 2; // 跳过接下来的两张牌
      }
    }
    return triples;
  }


  // 判断是否有更大的三带一
  function hasBiggerTrioWithSingle(playerCards, lastTrioWithSingle) {
    if (!Array.isArray(lastTrioWithSingle) || lastTrioWithSingle.length < 4) {
      console.error('Invalid lastTrioWithSingle:', lastTrioWithSingle);
      return false;
    }
    sortCards(lastTrioWithSingle);

    const trios = findTriples(playerCards);
    // 如果没有找到三张相同的牌，直接返回 false
    if (trios.length === 0) {
      console.error('玩家没有三代一啦', lastTrioWithSingle);
      return false;
    }

    const lastTrioValue = lastTrioWithSingle[0].value; // 假设三带一的前三张是三张相同的牌

    return trios.some(trio => {
      if (compareCards(trio[0], { value: lastTrioValue }) > 0) {
        // 如果找到更大的三张，检查是否有额外的单牌
        const remainingCards = playerCards.filter(card => !trio.includes(card));
        return remainingCards.length > 0;
      }
      return false;
    });
  }



  // 判断是否有更大的三带二
  function hasBiggerTrioWithPair(playerCards, lastTrioWithPair) {
    if (!isValidTrioWithPair(lastTrioWithPair)) {
      return false; // 如果上家出的不是有效的三带二，返回false
    }

    const lastTrioValue = lastTrioWithPair[0].value;
    const trios = findTriples(playerCards);
    // 如果没有找到三张相同的牌，直接返回 false
    if (trios.length === 0) {
      return false;
    }


    return trios.some(trio => {
      if (compareCards(trio[0], { value: lastTrioValue }) > 0) {
        // 如果找到更大的三张，检查是否有额外的一对
        const remainingCards = playerCards.filter(card => !trio.includes(card));
        const pairs = findPairs(remainingCards);
        return pairs.length > 0;
      }
      return false;
    });
  }


}

//给玩家的手牌排序
const handCardOrder = ['Big', 'Small', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3'];
const consecutiveOrder = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3'];


function comparePlayerCards(a, b) {
  if (a.suit === 'Joker' && b.suit === 'Joker') {
    return handCardOrder.indexOf(a.value) - handCardOrder.indexOf(b.value);
  }
  if (a.suit === 'Joker') return -1;
  if (b.suit === 'Joker') return 1;
  return handCardOrder.indexOf(a.value) - handCardOrder.indexOf(b.value);
}

/**
 * 通用的整理牌型的方法，按照牌型进行排序，但是对于从大到小的牌，需要另外处理
 * @param {*} cards 
 * @returns 
 */
export function sortCards(cards) {
  // 首先过滤掉无效的卡牌
  const validCards = cards.filter(card => card && card.value);

  // 如果没有有效卡牌，直接返回空数组
  if (validCards.length === 0) {
    console.warn('No valid cards to sort');
    return [];
  }

  // 计算每个值的出现次数
  const valueCounts = {};
  validCards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });

  // 定义牌的顺序（从小到大）
  const cardOrder = ['Big', 'Small', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3'];

  // 自定义排序函数
  return validCards.sort((a, b) => {
    // 首先比较牌的数量（数量多的排前面）
    const countDiff = valueCounts[b.value] - valueCounts[a.value];
    if (countDiff !== 0) return countDiff;

    // 如果数量相同，则按照牌的大小排序
    return cardOrder.indexOf(a.value) - cardOrder.indexOf(b.value);
  });
}

export function convertCards(cards) {
  // 检查 cards 是否为数组，这也会处理 null 和 undefined 的情况
  if (!Array.isArray(cards) || cards.length === 0) {
    return [];
  }

  // 原有的转换逻辑
  return cards.map(card => card?.value).filter(value => value !== undefined);
}

// 在文件的适当位置添加以下代码

const cardScores = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15, 'Small': 16, 'Big': 17
};

export function calculatePlaneWithNoneScore(cards) {
  cards = flattenArray(cards);
  if (cards.length < 6 && cards.length % 3 !== 0) {
    throw new Error('非法飞机不带牌牌型');
  }

  // 对牌进行排序
  const sortedCards = sortCards([...cards]);
  const cardValues = new Set(sortedCards.flat().map(card => card.value));

  let score = 0;
  cardValues.forEach(value => {
    score += cardScores[value] * 3 * 3 + 17;
  });

  return score;
}

/**
 * 计算三带两根的分数
 * @param {Array} cards - 包含5张牌的数组
 * @returns {number} - 计算得出的分数
 */
export function calculateTripleWithPairScore(cards) {
  if (cards.length !== 5) {
    throw new Error('三带二必须是5张牌');
  }

  // 对牌进行排序
  const sortedCards = sortCards([...cards]);

  // 找出三张相同的牌
  let tripleValue;
  let otherCards = [];

  for (let i = 0; i < 3; i++) {
    if (sortedCards[i].value === sortedCards[i + 1].value && sortedCards[i].value === sortedCards[i + 2].value) {
      tripleValue = sortedCards[i].value;
      otherCards = sortedCards.filter(card => card.value !== tripleValue);
      break;
    }
  }

  if (!tripleValue || otherCards.length !== 2) {
    throw new Error('无效的三带二组合');
  }

  // 计算分数
  const tripleScore = cardScores[tripleValue] * 3 * 3;
  const otherScore = cardScores[otherCards[0].value] + cardScores[otherCards[1].value];

  return tripleScore - otherScore + 17 * 2;
}

/**
 * 计算三带一根
 * @param {Array} cards - 包含4张牌的数组
 * @returns {number} - 计算得出的分数
 */
export function calculateTripleWithSingleScore(cards) {
  if (cards.length !== 4) {
    throw new Error('三带二必须是4张牌');
  }

  // 对牌进行排序
  const sortedCards = sortCards([...cards]);

  // 找出三张相同的牌
  let tripleValue;
  let otherCards = [];

  for (let i = 0; i < 3; i++) {
    if (sortedCards[i].value === sortedCards[i + 1].value && sortedCards[i].value === sortedCards[i + 2].value) {
      tripleValue = sortedCards[i].value;
      otherCards = sortedCards.filter(card => card.value !== tripleValue);
      break;
    }
  }

  if (!tripleValue || otherCards.length !== 1) {
    throw new Error('无效的三带一组合');
  }

  // 计算分数
  const tripleScore = cardScores[tripleValue] * 3 * 3;
  const otherScore = cardScores[otherCards[0].value];

  return tripleScore - otherScore + 17;
}

/**
 * 计算三根
 * @param {Array} cards - 包含3张牌的数组
 * @returns {number} - 计算得出的分数
 */
export function calculateTripleScore(cards) {
  if (cards.length !== 3) {
    throw new Error('三根必须是3张牌');
  }

  // 对牌进行排序
  const sortedCards = sortCards([...cards]);

  // 找出三张相同的牌
  let tripleValue;

  for (let i = 0; i < 3; i++) {
    if (sortedCards[i].value === sortedCards[i + 1].value && sortedCards[i].value === sortedCards[i + 2].value) {
      tripleValue = sortedCards[i].value;
      break;
    }
  }

  if (!tripleValue) {
    throw new Error('无效的三根组合');
  }
  // 计算分数
  const tripleScore = cardScores[tripleValue] * 3 * 3;
  return tripleScore;
}

/**
 * 计算顺子的分数
 * @param {Array} cards - 包含顺子牌的数组
 * @returns {number} - 单牌之和+17
 * 
 */
export function calculateStraightScore(cards) {

  // 对牌进行排序
  cards = sortCards([...cards]);

  if (!isStraight(cards)) {
    throw new Error('无效的顺子组合');
  }

  // 计算分数
  return cards.reduce((score, card) => score + cardScores[card.value], 0) + 17;
}

/**
 * 计算对子的分数
 * @param {Array} cards - 包含2张牌的数组
 * @returns {number} - 单牌分数 * 2 * 2
 */
export function calculatePairScore(cards) {
  if (cards.length !== 2 || cards[0].value !== cards[1].value) {
    throw new Error('无效的对子组合');
  }

  // 计算分数：单牌分数 * 2 * 2
  return cardScores[cards[0].value] * 2 * 2;
}

/**
 * 计算连对的分数
 * @param {Array} cards - 包含连对牌的数组
 * @returns {number} - 所有单牌分数之和 * 3
 */
export function calculateConsecutivePairsScore(cards) {
  if (cards.length % 2 !== 0 || cards.length < 4) {
    throw new Error('无效的连对合');
  }

  // 对牌进行排序
  cards = sortCards([...cards]);

  // 检查是否是有效的连对
  if (!isConsecutivePairs(cards)) {
    throw new Error('无效的连对组合');
  }

  // 计算分数：所有单牌分数之和 * 3
  const score = cards.reduce((sum, card) => sum + cardScores[card.value], 0);
  return score * 3;
}


/**
 * 计算普通炸弹分数
 * @param {Array} cards - 包含炸弹的牌的数组
 * @returns {number} - 单牌之和*4
 */
export function calculateBoomScore(cards) {
  if (cards.length !== 4) {
    throw new Error('无效的炸弹组合');
  }

  // 检查是否是有效的连对
  if (!isValidBomb(cards)) {
    throw new Error('无效的连对组合');
  }

  return cardScores[cards[0].value] * 4 * 4;
}

/**
 * 判断是否是王炸并计算分数
 * @param {Array} cards - 包含2张牌的数组
 * @returns {number|null} - 如果是王炸返回300分，否则返回null
 */
export function calculateRocketScore(cards) {
  if (cards.length !== 2) {
    return null;
  }

  const values = cards.map(card => card.value);
  if (values.includes('Big') && values.includes('Small')) {
    return 300;
  }

  return null;
}

/**
 * 计算单牌的分数
 * @param {Object} card - 包含牌的信息的对象
 * @returns {number} - 计算得出的分数
 */
export function calculateSingleCardScore(card) {
  const cardScore = cardScores[card.value];
  return cardScore;

  // if (cardScore < 10) {
  //   return -cardScore;
  // } else {
  //   return cardScore;
  // }
}

/**
 * 分析并拆分牌组，返回最优的拆分结果
 * @param {Array} cards - 包含所有牌的数组
 * @returns {Array} - 按分值从高到低排列的牌型数组
 */
export function analyzeAndSplitCards(cards) {
  cards = cards.sort(comparePlayerCards);
  const affectedCards = getAffectedCards(cards);
  const remainingCards = cards.filter(card => !affectedCards.includes(card));

  const method1Result = analyzeMethod1(affectedCards);
  const method2Result = analyzeMethod2(affectedCards);
  const method3Result = analyzeMethod3(affectedCards);

  console.log('Method 1 score:', method1Result.score);
  console.log('Method 2 score:', method2Result.score);
  console.log('Method 3 score:', method3Result.score);

  const bestMethod = [method1Result, method2Result, method3Result]
    .reduce((best, current) => current.score > best.score ? current : best);

  console.log('Best method score:', bestMethod.score);
  let array = flattenArray(bestMethod.combination);
  console.log('Best method combination:', array.map(card => card.value).join(','));

  // 为三代配牌
  let remainingCardsArr =analyzeRemainingCards(remainingCards);
  const combinationWithAttachedCards = attachCardsToTriples(bestMethod.combination, remainingCardsArr);

  // 处理剩余的牌
  const usedCards = new Set(combinationWithAttachedCards.flat().map(card => card));
  const finalRemainingCards = remainingCards.filter(card => !usedCards.has(card));

  let finalResult = [...combinationWithAttachedCards, ...analyzeRemainingCards(finalRemainingCards)];
  finalResult = finalResult.sort((a, b) => calculatePatternScore(b) - calculatePatternScore(a));

  // 添加新的转换步骤
  const formattedResult = {};
  finalResult.forEach(pattern => {
    const patternType = getCardPatternType(pattern);
    if (!formattedResult[patternType]) {
      formattedResult[patternType] = [];
    }
    formattedResult[patternType].push(pattern.map(card => card.value));
  });

  return finalResult;
}

function getAffectedCards(cards) {
  const longestStraight = findLongestStraight(cards);
  return cards.filter(card =>
    cardScores[card.value] >= cardScores[longestStraight[longestStraight.length - 1].value] &&
    cardScores[card.value] <= cardScores[longestStraight[0].value]
  );
}

function findLongestStraight(cards) {
  const uniqueValues = [...new Set(cards.map(card => card.value))];
  let longestStraight = [];
  let currentStraight = [uniqueValues[0]];

  for (let i = 1; i < uniqueValues.length; i++) {
    if (cardScores[uniqueValues[i]] === cardScores[uniqueValues[i - 1]] - 1) {
      currentStraight.push(uniqueValues[i]);
    } else {
      if (currentStraight.length > longestStraight.length) {
        longestStraight = [...currentStraight];
      }
      currentStraight = [uniqueValues[i]];
    }
  }

  if (currentStraight.length > longestStraight.length) {
    longestStraight = currentStraight;
  }

  // 将值转换回原始的卡牌对象
  return longestStraight.map(value =>
    cards.find(card => card.value === value)
  );
}

function analyzeRemainingCards(cards) {
  const pairs = findPairs(cards);
  const singles = cards.filter(card => !pairs.flat().includes(card));
  return [...pairs, ...singles.map(card => [card])];
}

function findAllStraights(cards) {
  const straights = [];
  const sortedCards = [...cards];
  const uniqueValues = [...new Set(sortedCards.map(card => card.value))];

  // 顺子的最小长度是5
  for (let length = 5; length <= uniqueValues.length; length++) {
    for (let start = 0; start <= uniqueValues.length - length; start++) {
      const potentialStraight = uniqueValues.slice(start, start + length);
      if (isValidStraight(potentialStraight)) {
        // 找到原始手牌中对应的牌
        const straightCards = potentialStraight.map(value =>
          sortedCards.find(card => card.value === value)
        );
        straights.push(straightCards);
      }
    }
  }

  return straights;
}

/**
 * 查找所有的三根 
 * @param {Array} cards - 包含所有牌的数组
 * @returns {Array} - 包含所有三根的数组，每个元素是一个三根的数组
 */
function findAllTriples(cards) {
  const triples = [];
  const sortedCards = sortCards([...cards]);
  for (let i = 0; i <= sortedCards.length - 3; i++) {
    if (sortedCards[i].value === sortedCards[i + 1].value && sortedCards[i].value === sortedCards[i + 2].value) {
      triples.push([sortedCards[i], sortedCards[i + 1], sortedCards[i + 2]]);
      i += 2; // 跳过接下来的两张牌
    }
  }
  return triples;
}

// function formPlanes(triples, cards) {
//   const planes = [];
//   const sortedTriples = sortCards(triples.map(triple => triple[0]));
//   for (let i = 0; i < sortedTriples.length - 1; i++) {
//     if (cardScores[sortedTriples[i + 1].value] === cardScores[sortedTriples[i].value] + 1) {
//       const plane = [...triples[i], ...triples[i + 1]];
//       const remainingCards = cards.filter(card => !plane.includes(card));
//       if (remainingCards.length >= 2) {
//         planes.push([...plane, ...remainingCards.slice(0, 2)]);
//       }
//     }
//   }
//   return planes;
// }

function findConsecutivePairs(cards) {
  const pairs = findPairs(cards);
  const consecutivePairs = [];
  let currentConsecutive = [];

  for (let i = 0; i < pairs.length; i++) {
    if (currentConsecutive.length === 0 ||
      cardScores[pairs[i][0].value] === cardScores[currentConsecutive[currentConsecutive.length - 1][0].value] - 1) {
      currentConsecutive.push(pairs[i]);
    } else {
      if (currentConsecutive.length >= 2) {
        consecutivePairs.push(currentConsecutive.flat());
      }
      currentConsecutive = [pairs[i]];
    }
  }

  // 处理最后一组连续对
  if (currentConsecutive.length >= 2) {
    consecutivePairs.push(currentConsecutive.flat());
  }

  // 生成所有可能的连续对子组合
  const allConsecutivePairs = [];
  for (const pairSet of consecutivePairs) {
    for (let length = 2; length <= pairSet.length / 2; length++) {
      for (let start = 0; start <= pairSet.length - length * 2; start += 2) {
        allConsecutivePairs.push(pairSet.slice(start, start + length * 2));
      }
    }
  }

  return allConsecutivePairs;
}

function calculatePatternScore(pattern) {
  const patternType = getCardPatternType(pattern);
  switch (patternType) {
    case 'single':
      return calculateSingleCardScore(pattern[0]);
    case 'pair':
      return calculatePairScore(pattern);
    case 'triple':
      return calculateTripleScore(pattern);
    case 'tripleWithOne':
      return calculateTripleWithSingleScore(pattern);
    case 'tripleWithTwo':
      return calculateTripleWithPairScore(pattern);
    case 'straight':
      return calculateStraightScore(pattern);
    case 'consecutivePairs':
      return calculateConsecutivePairsScore(pattern);
    case 'bomb':
      return calculateBoomScore(pattern);
    case 'rocket':
      return calculateRocketScore(pattern);
    case 'planeWithNone':
      return calculatePlaneWithNoneScore(pattern);
    default:
      return 0;
  }
}

function calculateTotalScore(patterns) {
  return patterns.reduce((total, pattern) => total + calculatePatternScore(pattern), 0);
}


// 添加这个新函数来处理炸弹
function findBombs(cards) {
  const bombs = [];
  for (let i = 0; i <= cards.length - 4; i++) {
    if (cards[i].value === cards[i + 1].value &&
      cards[i].value === cards[i + 2].value &&
      cards[i].value === cards[i + 3].value) {
      bombs.push(cards.slice(i, i + 4));
    }
  }
  // 检查王炸
  if (cards.some(card => card.value === 'Small') && cards.some(card => card.value === 'Big')) {
    bombs.push([{ value: 'Small' }, { value: 'Big' }]);
  }
  return bombs;
}

/**
 * 将多维数组展平为一维数组
 * @param {Array} arr - 需要展平的数组
 * @returns {Array} - 展平后的一维数组
 */
function flattenArray(arr) {
  return arr.reduce((flat, toFlatten) => {
    return flat.concat(Array.isArray(toFlatten) ? flattenArray(toFlatten) : toFlatten);
  }, []);
}

/**
 * 先找连续的三根再找三根，在找对子
 * @param {*} cards 
 * @returns 
 */
function analyzeMethod1(cards) {
  cards = cards.sort(comparePlayerCards);

  let combination = [];


  const consecutiveTriples = findConsecutiveTriples(cards);
  let triples = [];
  let remainingCards3 = cards;

  if (consecutiveTriples.length > 0) {
    // 使用 flattenArray 来展平 consecutiveTriples
    const flattenedTriples = flattenArray(consecutiveTriples);
    remainingCards3 = cards.filter(card => !flattenedTriples.includes(card));
    combination = [...consecutiveTriples];
  } else {
    triples = findAllTriples(cards);
    const flattenedTriples = flattenArray(triples);
    combination = [...triples];
    remainingCards3 = cards.filter(card => !flattenedTriples.includes(card));
  }


  const consecutivePairs = findConsecutivePairs(remainingCards3);
  if (consecutivePairs.length > 0) {
    combination.push(...consecutivePairs);

    const flattenedTriples = flattenArray(consecutivePairs);
    remainingCards3 = remainingCards3.filter(card => !flattenedTriples.includes(card));
  }
  combination.push(...analyzeRemainingCards(remainingCards3));

  const score = calculateTotalScore(combination);

  console.log("方法1");
  console.log("最佳组合：", combination.map(cards => cards.map(card => card.value).join(',')).join(' | '));
  console.log("最高分数：", score);

  return {
    score: score,
    combination: combination
  };
}

/**
 * 先找顺子，再找连续三根或三根，在找对子
 * @param {*} cards 
 * @returns 
 */
export function analyzeMethod2(cards) {
  cards = cards.sort(comparePlayerCards);

  let bestCombination = [];
  let highestScore = 0;

  const allStraights1 = findAllStraights(cards);

  allStraights1.forEach(straight => {

    const remainingCards1 = cards.filter(card => !straight.includes(card));
    const consecutiveTriples = findConsecutiveTriples(remainingCards1);
    let triples = [];
    let remainingCards3 = remainingCards1;

    if (consecutiveTriples.length > 0) {
      remainingCards3 = remainingCards1.filter(card => !consecutiveTriples.flat().includes(card));
    } else {
      triples = findAllTriples(remainingCards1);
      remainingCards3 = remainingCards1.filter(card => !triples.flat().includes(card));
    }

    const consecutivePairs = findConsecutivePairs(remainingCards3);

    const finalRemainingCards = remainingCards3.filter(card => !consecutivePairs.flat().includes(card));

    let combination = [straight];
    if (consecutiveTriples.length > 0) {
      combination.push(...consecutiveTriples);
    }
    if (triples.length > 0) {
      combination.push(...triples);
    }
    if (consecutivePairs.length > 0) {
      combination.push(...consecutivePairs);
    }
    combination.push(...analyzeRemainingCards(finalRemainingCards));

    const score = calculateTotalScore(combination);


    if (score > highestScore) {
      highestScore = score;
      bestCombination = combination;
    }
  });
  console.log("方法2");

  console.log("最佳组合：", bestCombination.map(cards => cards.map(card => card.value).join(',')).join(' | '));
  console.log("最高分数：", highestScore);

  return {
    score: highestScore,
    combination: bestCombination
  };
}

export function analyzeMethod3(cards) {
  cards = cards.sort(comparePlayerCards);

  const bombs = findBombs(cards);
  let remainingCards = cards;

  let result = [];
  let totalScore = 0;

  if (bombs.length > 0) {
    result.push(...bombs);
    remainingCards = remainingCards.filter(card => !bombs.flat().includes(card));
  }

  let highestScore = 0;
  let bestCombination = [];
  const consecutivePairs = findConsecutivePairs(remainingCards);
  if (consecutivePairs.length > 0) {
    consecutivePairs.forEach(pair => {
      const score = calculatePatternScore(pair);

      if (score > highestScore) {
        highestScore = score;
        bestCombination = pair;
      }
    });

    if (highestScore > 0) {
      result.push(bestCombination);
      remainingCards = remainingCards.filter(card => !bestCombination.flat().includes(card));
    }
  }

  const straights = findAllStraights(remainingCards);
  if (straights.length > 0) {
    result.push(...straights);
    remainingCards = remainingCards.filter(card => !straights.flat().includes(card));
  }

  result.push(...analyzeRemainingCards(remainingCards));
  totalScore = calculateTotalScore(result);
  console.log("方法3");
  console.log("最佳组合：", result.map(cards => cards.map(card => card.value).join(',')).join(' | '));
  console.log("最高分数：", totalScore);

  return {
    score: totalScore,
    combination: result
  };
}

// 在文件的适当位置添加以下函数

/**
 * 计算一组牌的最高分数
 * @param {Array} cards - 包含所有牌的数组
 * @returns {Object} - 包含最高分数和对应的拆分方法
 */
export function calculateHighestScore(cards) {
  cards = cards.sort(comparePlayerCards);
  const allCombinations = generateAllCombinations(cards);
  let highestScore = 0;
  let bestCombination = null;

  for (const combination of allCombinations) {
    const score = calculateCombinationScore(combination);
    if (score > highestScore) {
      highestScore = score;
      bestCombination = combination;
    }
  }

  return {
    score: highestScore,
    combination: bestCombination
  };
}

function generateAllCombinations(cards) {
  const combinations = [];
  const patterns = [
    findSingles,
    findPairs,
    findAllTriples,
    findTripleWithSingle,
    findTripleWithPair,
    findStraights,
    findConsecutivePairs,
    findBombs,
    findRocket
  ];

  for (const patternFinder of patterns) {
    combinations.push(...patternFinder(cards));
  }

  return combinations;
}

function calculateCombinationScore(combination) {
  return combination.reduce((total, pattern) => {
    return total + calculatePatternScore(pattern);
  }, 0);
}

// 以下是辅助函数，用于找出各种牌型
function findSingles(cards) {
  return cards.map(card => [card]);
}

function findPairs(cards) {
  const pairs = [];
  for (let i = 0; i < cards.length - 1; i++) {
    if (cards[i].value === cards[i + 1].value) {
      pairs.push([cards[i], cards[i + 1]]);
      i++; // 跳过下一张牌
    }
  }
  return pairs;
}


function findTripleWithSingle(cards) {
  const triples = findAllTriples(cards);
  const result = [];
  for (const triple of triples) {
    const remainingCards = cards.filter(card => !triple.includes(card));
    if (remainingCards.length > 0) {
      result.push([...triple, remainingCards[0]]);
    }
  }
  return result;
}

function findTripleWithPair(cards) {
  const triples = findAllTriples(cards);
  const result = [];
  for (const triple of triples) {
    const remainingCards = cards.filter(card => !triple.includes(card));
    const pairs = findPairs(remainingCards);
    if (pairs.length > 0) {
      result.push([...triple, ...pairs[0]]);
    }
  }
  return result;
}

function findStraights(cards) {
  const straights = [];
  const sortedCards = sortCards([...cards]);
  const uniqueCards = Array.from(new Set(sortedCards.map(card => card.value)));

  // 顺子的最小长度是5
  for (let length = 5; length <= uniqueCards.length; length++) {
    for (let start = 0; start <= uniqueCards.length - length; start++) {
      const potentialStraight = uniqueCards.slice(start, start + length);
      if (isValidStraight(potentialStraight)) {
        // 将值转换回原始的卡牌对象
        const straightCards = potentialStraight.map(value =>
          sortedCards.find(card => card.value === value)
        );
        straights.push(straightCards);
      }
    }
  }

  return straights;
}

function isValidStraight(values) {
  const startIndex = consecutiveOrder.indexOf(values[0]);
  if (startIndex === -1) return false; // 如果包含 '2' 或大小王，不是有效的顺子

  for (let i = 1; i < values.length; i++) {
    if (consecutiveOrder.indexOf(values[i]) !== startIndex + i) {
      return false;
    }
  }
  return true;
}

function findRocket(cards) {
  const smallJoker = cards.find(card => card.value === 'Small');
  const bigJoker = cards.find(card => card.value === 'Big');
  return smallJoker && bigJoker ? [[smallJoker, bigJoker]] : [];
}

/**
 * 查找连续的三根
 * @param {Array} cards - 包含所有牌的数组
 * @returns {Array} - 包含所有连续三根的数组，每个元素是一个连续三根的数组
 */
export function findConsecutiveTriples(cards) {
  const triples = findAllTriples(cards);
  if (triples.length < 2) return []; // 如果三根数量少于2，不可能有连续的三根

  const sortedTriples = triples.sort((a, b) => cardScores[b[0].value] - cardScores[a[0].value]);
  const consecutiveTriples = [];
  let currentConsecutive = [sortedTriples[0]];

  for (let i = 1; i < sortedTriples.length; i++) {
    const currentValue = cardScores[sortedTriples[i][0].value];
    const previousValue = cardScores[sortedTriples[i - 1][0].value];

    if (previousValue - currentValue === 1) {
      currentConsecutive.push(sortedTriples[i]);
    } else {
      if (currentConsecutive.length >= 2) {
        consecutiveTriples.push([...currentConsecutive]);
      }
      currentConsecutive = [sortedTriples[i]];
    }
  }

  if (currentConsecutive.length >= 2) {
    consecutiveTriples.push(currentConsecutive);
  }

  return consecutiveTriples;
}

/**
 * 为三代和连续三代配牌
 * @param {Array} combination - 牌型组合
 * @param {Array} remainingCards - 剩余的牌
 * @returns {Array} - 处理后的牌型组合
 */
function attachCardsToTriples(combination, remainingCards) {
  const newCombination = [];
  
  // 分别处理 combination 和 remainingCards，取出对子和单根
  const combinationSinglesAndPairs = extractSinglesAndPairsFromCombination(combination);
  const remainingSinglesAndPairs = extractSinglesAndPairsFromCombination(remainingCards);
  
  // 合并所有可用的单牌和对子
  let availableSingles = [...combinationSinglesAndPairs.singles, ...remainingSinglesAndPairs.singles];
  let availablePairs = [...combinationSinglesAndPairs.pairs, ...remainingSinglesAndPairs.pairs];

  // 找出所有连续三根和普通三根
  const consecutiveTriples = [];
  const normalTriples = [];
  const otherPatterns = [];
  
  combination.forEach(pattern => {
    const patternType = getCardPatternType(pattern);
    if (patternType === 'planeWithNone') {
      consecutiveTriples.push(pattern);
    } else if (patternType === 'triple') {
      normalTriples.push(pattern);
    } else if (!['single', 'pair'].includes(patternType)) {
      otherPatterns.push(pattern);
    }
  });

  // 处理连续三根
  const processedConsecutiveTriples = attachCardsToConsecutiveTriples(
    consecutiveTriples,
    availablePairs,
    availableSingles
  );

  // 更新可用的单牌和对子
  const remainingAttachments = getRemainingAttachments(
    processedConsecutiveTriples.usedCards,
    availableSingles,
    availablePairs
  );

  // 处理普通三根
  const processedNormalTriples = attachCardsToNormalTriples(
    normalTriples,
    remainingAttachments.pairs,
    remainingAttachments.singles
  );

  // 将处理后的牌型添加到结果中
  newCombination.push(...processedConsecutiveTriples.patterns);
  newCombination.push(...processedNormalTriples.patterns);

  // 添加未使用的单牌和对子
  const finalUnusedCards = getRemainingCards(
    [...processedConsecutiveTriples.usedCards, ...processedNormalTriples.usedCards],
    [...availableSingles, ...availablePairs.flat()]
  );
  
  // 将未使用的牌重新组合成单牌和对子
  const finalPatterns = regroupRemainingCards(finalUnusedCards);
  newCombination.push(...finalPatterns);

  return newCombination;
}

// 处理 combination 结构
function extractSinglesAndPairsFromCombination(combination) {
  const singles = [];
  const pairs = [];
  
  combination.forEach(pattern => {
    const patternType = getCardPatternType(pattern);
    if (patternType === 'single') {
      singles.push(...pattern);
    } else if (patternType === 'pair') {
      pairs.push(pattern);
    }
  });

  return { singles, pairs };
}

/**
 * 给连续三根配牌 
 * @param {*} consecutiveTriples 
 * @param {*} pairs 
 * @param {*} singles 
 * @returns 
 */
function attachCardsToConsecutiveTriples(consecutiveTriples, pairs, singles) {
  const patterns = [];
  const usedCards = new Set();
  
  consecutiveTriples.forEach(triple => {
    const tripleCount = triple.length; // 每组连续三根包含的三根数量
    
    // 尝试先用对子配牌
    if (pairs.length >= tripleCount) {
      const attachedPairs = pairs.slice(0, tripleCount);
      patterns.push([...triple, ...attachedPairs]);
      attachedPairs.flat().forEach(card => usedCards.add(card));
      //删除使用的元素
      pairs.splice(0, tripleCount);
    }
    // 如果对子不够，使用单牌
    else if (singles.length >= tripleCount * 2) {
      const attachedSingles = singles.slice(0, tripleCount * 2).map(single => [single]);
      patterns.push([...triple, ...attachedSingles]);
      attachedSingles.forEach(card => usedCards.add(card));
      //删除使用的元素  
      singles.splice(0, tripleCount * 2);
    }
    // 如果单牌也不够，只能作为普通三根
    else {
      patterns.push(triple);
    }
  });

  return { patterns, usedCards };
}

function attachCardsToNormalTriples(normalTriples, pairs, singles) {
  const patterns = [];
  const usedCards = new Set();

  normalTriples.forEach(triple => {
    // 优先使用对子
    if (pairs.length > 0) {
      const pair = pairs[0];
      patterns.push([...triple, ...pair]);
      pair.forEach(card => usedCards.add(card));
      pairs.shift();
    }
    // 其次使用单牌
    else if (singles.length >= 2) {
      const attachedSingles = singles.slice(0, 2);
      patterns.push([...triple, ...attachedSingles]);
      attachedSingles.forEach(card => usedCards.add(card));
      singles.splice(0, 2);
    }
    // 如果没有足够的牌，保持原样
    else {
      patterns.push(triple);
    }
  });

  return { patterns, usedCards };
}

function getRemainingAttachments(usedCards, singles, pairs) {
  return {
    singles: singles.filter(card => !usedCards.has(card)),
    pairs: pairs.filter(pair => !pair.some(card => usedCards.has(card)))
  };
}

function getRemainingCards(usedCards, allCards) {
  return allCards.filter(card => !usedCards.has(card));
}

function regroupRemainingCards(cards) {
  const patterns = [];
  const sortedCards = sortCards([...cards]);
  
  // 先找对子
  for (let i = 0; i < sortedCards.length - 1; i++) {
    if (sortedCards[i].value === sortedCards[i + 1].value) {
      patterns.push([sortedCards[i], sortedCards[i + 1]]);
      i++;
    } else {
      patterns.push([sortedCards[i]]);
    }
  }
  
  // 处理最后一张牌（如果有的话）
  if (sortedCards.length % 2 !== 0 && !patterns.flat().includes(sortedCards[sortedCards.length - 1])) {
    patterns.push([sortedCards[sortedCards.length - 1]]);
  }
  
  return patterns;
}


export function  identifyCombinations(cards) {
  const combinations = {
      singles: [],
      pairs: [],
      triples: [],
      tripleWithOne: [],
      tripleWithTwo: [],
      straights: [],
      bombs: [],
      consecutivePairs: []
  };

  const tripleSets = new Set();
  for (let i = 0; i < cards.length - 2; i++) {
      if (cards[i].value === cards[i + 1].value && cards[i].value === cards[i + 2].value) {
          tripleSets.add(cards[i].value);
          combinations.triples.push(cards.slice(i, i + 3));
          i += 2;
      }
  }

  for (let i = 0; i < cards.length; i++) {
      if (i + 3 < cards.length &&
          cards[i].value === cards[i + 1].value &&
          cards[i].value === cards[i + 2].value &&
          cards[i].value === cards[i + 3].value) {
          combinations.bombs.push(cards.slice(i, i + 4));
          i += 3;
      } else if (!tripleSets.has(cards[i].value)) {
          if (i + 1 < cards.length && cards[i].value === cards[i + 1].value) {
              combinations.pairs.push(cards.slice(i, i + 2));
              i += 1;
          } else {
              combinations.singles.push(cards[i]);
          }
      }
  }

  combinations.triples.forEach(triple => {
      const remainingCards = cards.filter(card => !triple.includes(card));
      if (remainingCards.length >= 1) {
          combinations.tripleWithOne.push([...triple, remainingCards[0]]);
      }
      if (remainingCards.length >= 2) {
          combinations.tripleWithTwo.push([...triple, remainingCards[0], remainingCards[1]]);
      }
  });

  combinations.straights = findStraights(cards);
  combinations.consecutivePairs = findConsecutivePairs(cards);   

  return combinations;
}
