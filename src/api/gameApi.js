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
export function validateCardPattern(cards) {
  if (cards.length === 0) return false;

  // 对牌进行排序
  sortCards(cards);

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
    // 顺子
    if (isStraight(cards)) return true;

    // 飞机（连续的三带一或三带二）
    if (isPlane(cards)) return true;

    // 三带一或三带二
    if (cards.length === 4) {
      if (isTriplePlusCards(cards)) return true;
    }
    if (cards.length == 5) {
      if (isValidTrioWithPair(cards)) return true;

    }


  }

  return false;
}

export function getCardPatternType(cards) {
  // 首先确保牌已排序
  const sortedCards = sortCards(cards);
  const values = sortedCards.map(card => card.value);
  const uniqueValues = [...new Set(values)];

  // 单张
  if (values.length === 1) {
    return 'single';
  }

  // 对子
  if (values.length === 2 && uniqueValues.length === 1) {
    return 'pair';
  }

  // 三带一或三带二
  if (values.length === 4 && (uniqueValues.length === 2 && (values[0] === values[1] && values[1] === values[2] || values[1] === values[2] && values[2] === values[3]))) {
    return 'threeWithOne';
  }
  if (values.length === 5 && uniqueValues.length === 2 && (values[0] === values[1] && values[1] === values[2] || values[2] === values[3] && values[3] === values[4])) {
    return 'threeWithTwo';
  }
  // 三张
  if (values.length === 3 && (uniqueValues.length === 1)) {
    return 'three';
  }

  // 连对
  if (values.length >= 6 && values.length % 2 === 0) {
    let isConsecutivePairs = true;
    for (let i = 0; i < values.length; i += 2) {
      if (values[i] !== values[i + 1] || (i > 0 && values[i] !== values[i - 2] + 1)) {
        isConsecutivePairs = false;
        break;
      }
    }
    if (isConsecutivePairs) {
      return 'consecutivePairs';
    }
  }

  // 飞机带翅膀
  if (values.length >= 8 && values.length % 4 === 0) {
    const threeCount = values.length / 4;
    let isPlaneWithWings = true;
    for (let i = 0; i < threeCount * 3; i += 3) {
      if (values[i] !== values[i + 1] || values[i] !== values[i + 2] || (i > 0 && values[i] !== values[i - 3] + 1)) {
        isPlaneWithWings = false;
        break;
      }
    }
    if (isPlaneWithWings) {
      return 'planeWithWings';
    }
  }

  // 顺子
  if (values.length >= 5 && uniqueValues.length === values.length) {
    let isStraight = true;
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i - 1] + 1) {
        isStraight = false;
        break;
      }
    }
    if (isStraight) {
      return 'straight';
    }
  }

  // 炸弹
  if (values.length === 4 && uniqueValues.length === 1) {
    return 'bomb';
  }

  // 如果没有匹配到任何牌型，返回 null 或者一个表示无效牌型的字符串
  return null;
}



function isConsecutivePairs(cards) {
  if (cards.length % 2 !== 0) return false;

  for (let i = 0; i < cards.length; i += 2) {
    // 检查是否为对子
    if (cards[i].value !== cards[i + 1].value) return false;

    // 检查对子是否连续(除了最后一个对子)
    if (i < cards.length - 2) {
      const currentPairIndex = cardOrder.indexOf(cards[i].value);
      const nextPairIndex = cardOrder.indexOf(cards[i + 2].value);

      // 如果下一个对子不是当前对子的下一个顺序,或者是2或者大小王,就不是连对
      if (currentPairIndex !== nextPairIndex + 1 || currentPairIndex >= cardOrder.indexOf('2')) {
        return false;
      }
    }
  }
  return true;
}

// 判断是否是有效的三带二
function isValidTrioWithPair(cards) {
  if (cards.length !== 5) return false;

  const [a, b, c, d, e] = cards;
  return (a.value === b.value && b.value === c.value && d.value === e.value);
}

function isTriplePlusCards(cards) {
  const valueCounts = {};
  cards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });
  const counts = Object.values(valueCounts);
  return counts.includes(3) && (counts.includes(1));
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

  const triples = Object.entries(valueCounts).filter(([, count]) => count === 3).map(([value]) => value);
  if (triples.length < 2) return false;

  // 检查三张是否连续
  triples.sort((a, b) => cardOrder.indexOf(b) - cardOrder.indexOf(a));
  for (let i = 1; i < triples.length; i++) {
    if (cardOrder.indexOf(triples[i - 1]) - cardOrder.indexOf(triples[i]) !== 1) return false;
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
  // 连对的比较只需要比��第一对
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
  if (cards.length === 4 && isTriplePlusCards(cards)) return 'triplePlusOne';
  if (cards.length === 5 && isValidTrioWithPair(cards)) return 'triplePlusTwo';
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

  // 检查主要部分是否至少有3张牌
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
    case 'triplePlusOne':
      return hasBiggerTrioWithSingle(playerCards, lastPlayedCards);
    case 'triplePlusTwo':
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
    const triple = findTriple(playerCards);
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
  function findTriple(cards) {
    const triple = [];
    // 首先检查cards是否至少有三张牌
    if (cards.length < 3) {
      return triple; // 如果少于三张牌，直接返回空数组
    }
    for (let i = 0; i < cards.length - 2; i++) {
      // 如果当前卡牌和接下来的两张卡牌值相同，则为三张
      if (cards[i].value === cards[i + 1].value && cards[i].value === cards[i + 2].value) {
        triple.push([cards[i], cards[i + 1], cards[i + 2]]);
        // 跳过接下来的两张卡牌，因为它们已经被使用了
        i += 2;
      }
    }
    return triple;
  }


  // 判断是否有更大的三带一
  function hasBiggerTrioWithSingle(playerCards, lastTrioWithSingle) {
    if (!Array.isArray(lastTrioWithSingle) || lastTrioWithSingle.length < 4) {
      console.error('Invalid lastTrioWithSingle:', lastTrioWithSingle);
      return false;
    }
    sortCards(lastTrioWithSingle);

    const trios = findTriple(playerCards);
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
    const trios = findTriple(playerCards);
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


export function sortCards(cards) {
  // 首先计算每个值的出现次数
  const valueCounts = {};
  cards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });

  // 定义牌的顺序（从小到大）
  const cardOrder = ['Big', 'Small', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3'];
  // 自定义排序函数
  return cards.sort((a, b) => {
    // 首先比较牌的数量（数量多的排前面），如果a的数量多，那么值为负，那么负值则a排在前面
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