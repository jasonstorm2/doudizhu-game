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

export function getCardPatternType(cards) {
  const sortedCards = sortCards([...cards]);
  const values = sortedCards.map(card => card.value);
  const uniqueValues = [...new Set(values)];

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
    if (isPlane(sortedCards)) return 'plane';
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

function getCardPattern(cards) {
  if (cards.length === 1) return 'single';
  if (cards.length === 2 && cards[0].value === cards[1].value) return 'pair';
  if (cards.length === 3 && cards[0].value === cards[1].value && cards[1].value === cards[2].value) return 'triple';
  if (cards.length === 4 && isTriplePlusCards(cards)) return 'tripleWithOne';
  if (cards.length === 5 && isTriplePlusCards(cards)) return 'tripleWithTwo';
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

  // 检查玩家���否有普通炸弹
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
  const lastCardType = getCardPattern(lastPlayedCards);
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

      // 检查三张是否连续(除了最后一组)
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



  function compareCards(card1, card2) {
    if (!card1 || !card2 || !card1.value || !card2.value) {
      console.error('Invalid card in compareCards:', card1, card2);
      return 0; // 或者抛出一个错误
    }
    return cardOrder.indexOf(card1.value) - cardOrder.indexOf(card2.value);
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
      if (sortedCards[i].value === sortedCards[i+1].value && sortedCards[i].value === sortedCards[i+2].value) {
        triples.push([sortedCards[i], sortedCards[i+1], sortedCards[i+2]]);
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

  return tripleScore - otherScore + 17*2;
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
  return cards.reduce((score, card) => score + cardScores[card.value], 0)+17;
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
  const affectedCards = getAffectedCards(cards);
  const remainingCards = cards.filter(card => !affectedCards.includes(card));

  const method1Result = analyzeMethod1(affectedCards);
  const method2Result = analyzeMethod2(affectedCards);
  const method3Result = analyzeMethod3(affectedCards);

  const bestMethod = [method1Result, method2Result, method3Result]
    .reduce((best, current) => calculateTotalScore(current) > calculateTotalScore(best) ? current : best);

  const finalResult = [...bestMethod, ...analyzeRemainingCards(remainingCards)];
  return finalResult.sort((a, b) => calculatePatternScore(b) - calculatePatternScore(a));
}

function getAffectedCards(cards) {
  const longestStraight = findLongestStraight(cards);
  return cards.filter(card => 
    cardScores[card.value] >= cardScores[longestStraight[0].value] && 
    cardScores[card.value] <= cardScores[longestStraight[longestStraight.length - 1].value]
  );
}

function findLongestStraight(cards) {
  const sortedCards = sortCards([...cards]);
  let longestStraight = [];
  let currentStraight = [sortedCards[0]];

  for (let i = 1; i < sortedCards.length; i++) {
    if (cardScores[sortedCards[i].value] === cardScores[sortedCards[i-1].value] + 1) {
      currentStraight.push(sortedCards[i]);
    } else {
      if (currentStraight.length > longestStraight.length) {
        longestStraight = [...currentStraight];
      }
      currentStraight = [sortedCards[i]];
    }
  }

  if (currentStraight.length > longestStraight.length) {
    longestStraight = currentStraight;
  }

  return longestStraight;
}

function analyzeRemainingCards(cards) {
  const pairs = findPairs(cards);
  const singles = cards.filter(card => !pairs.flat().includes(card));
  return [...pairs, ...singles.map(card => [card])];
}

function findAllStraights(cards) {
  const straights = [];
  for (let length = 5; length <= cards.length; length++) {
    straights.push(...findStraightsOfLength(cards, length));
  }
  return straights;
}

function findStraightsOfLength(cards, length) {
  const straights = [];
  const sortedCards = sortCards([...cards]);
  for (let i = 0; i <= sortedCards.length - length; i++) {
    const potentialStraight = sortedCards.slice(i, i + length);
    if (isStraight(potentialStraight)) {
      straights.push(potentialStraight);
    }
  }
  return straights;
}

function findTriples(cards) {
  const triples = [];
  const sortedCards = sortCards([...cards]);
  for (let i = 0; i <= sortedCards.length - 3; i++) {
    if (sortedCards[i].value === sortedCards[i+1].value && sortedCards[i].value === sortedCards[i+2].value) {
      triples.push([sortedCards[i], sortedCards[i+1], sortedCards[i+2]]);
      i += 2; // 跳过接下来的两张牌
    }
  }
  return triples;
}

function formPlanes(triples, cards) {
  const planes = [];
  const sortedTriples = sortCards(triples.map(triple => triple[0]));
  for (let i = 0; i < sortedTriples.length - 1; i++) {
    if (cardScores[sortedTriples[i+1].value] === cardScores[sortedTriples[i].value] + 1) {
      const plane = [...triples[i], ...triples[i+1]];
      const remainingCards = cards.filter(card => !plane.includes(card));
      if (remainingCards.length >= 2) {
        planes.push([...plane, ...remainingCards.slice(0, 2)]);
      }
    }
  }
  return planes;
}

function findConsecutivePairs(cards) {
  const pairs = findPairs(cards);
  const consecutivePairs = [];
  for (let i = 0; i < pairs.length - 1; i++) {
    if (cardScores[pairs[i+1][0].value] === cardScores[pairs[i][0].value] + 1) {
      consecutivePairs.push([...pairs[i], ...pairs[i+1]]);
    }
  }
  return consecutivePairs;
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
    if (cards[i].value === cards[i+1].value && 
        cards[i].value === cards[i+2].value && 
        cards[i].value === cards[i+3].value) {
      bombs.push(cards.slice(i, i+4));
    }
  }
  // 检查王炸
  if (cards.some(card => card.value === 'Small') && cards.some(card => card.value === 'Big')) {
    bombs.push([{value: 'Small'}, {value: 'Big'}]);
  }
  return bombs;
}

// 在每个分析方法中添加对炸弹的处理
function analyzeMethod1(cards) {
  const bombs = findBombs(cards);
  const straights = findAllStraights(cards);
  const bestStraight = straights.reduce((best, current) => 
    calculatePatternScore(current) > calculatePatternScore(best) ? current : best, []);
  
  const remainingCards = cards.filter(card => !bestStraight.includes(card));
  const triples = findTriples(remainingCards);
  const planes = formPlanes(triples, remainingCards);
  
  const afterPlanesCards = remainingCards.filter(card => !planes.flat().includes(card));
  const consecutivePairs = findConsecutivePairs(afterPlanesCards);
  
  const finalRemainingCards = afterPlanesCards.filter(card => !consecutivePairs.flat().includes(card));
  
  return [...bombs, bestStraight, ...planes, ...consecutivePairs, ...analyzeRemainingCards(finalRemainingCards)];
}

function analyzeMethod2(cards) {
  const bombs = findBombs(cards);
  const triples = findTriples(cards);
  const planes = formPlanes(triples, cards);
  
  const afterPlanesCards = cards.filter(card => !planes.flat().includes(card));
  const consecutivePairs = findConsecutivePairs(afterPlanesCards);
  
  const finalRemainingCards = afterPlanesCards.filter(card => !consecutivePairs.flat().includes(card));
  const straights = findAllStraights(finalRemainingCards);
  
  return [...bombs, ...planes, ...consecutivePairs, ...straights, ...analyzeRemainingCards(finalRemainingCards.filter(card => !straights.flat().includes(card)))];
}

function analyzeMethod3(cards) {
  const bombs = findBombs(cards);
  const consecutivePairs = findConsecutivePairs(cards);
  const remainingCards = cards.filter(card => !consecutivePairs.flat().includes(card));
  const straights = findAllStraights(remainingCards);
  const finalRemainingCards = remainingCards.filter(card => !straights.flat().includes(card));
  
  return [...bombs, ...consecutivePairs, ...straights, ...analyzeRemainingCards(finalRemainingCards)];
}

// 在文件的适当位置添加以下函数

/**
 * 计算一组牌的最高分数
 * @param {Array} cards - 包含所有牌的数组
 * @returns {Object} - 包含最高分数和对应的拆分方法
 */
export function calculateHighestScore(cards) {
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
    findTriples,
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
  const triples = findTriples(cards);
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
  const triples = findTriples(cards);
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
  const order = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const startIndex = order.indexOf(values[0]);
  if (startIndex === -1) return false; // 如果包含 '2' 或大小王，不是有效的顺子

  for (let i = 1; i < values.length; i++) {
    if (order.indexOf(values[i]) !== startIndex + i) {
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
