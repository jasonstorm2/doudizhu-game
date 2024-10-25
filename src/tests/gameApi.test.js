import { calculateTripleWithPairScore ,calculateTripleWithSingleScore, 
  calculateStraightScore, calculatePairScore, calculateConsecutivePairsScore, 
  calculateRocketScore, calculateSingleCardScore,
  analyzeAndSplitCards, findConsecutiveTriples ,calculateHighestScore} from '../api/gameApi';
import { describe, test, expect } from '@jest/globals';


describe.skip('calculateTripleWithPairScore', () => {
  test('正确计算三带二的分数', () => {
    const cards = [
      { value: '7', suit: 'hearts' },
      { value: '7', suit: 'diamonds' },
      { value: '7', suit: 'spades' },
      { value: '4', suit: 'clubs' },
      { value: '4', suit: 'hearts' }
    ];
    expect(calculateTripleWithPairScore(cards)).toBe(56); // (7 * 3 * 3) - 4 - 4 = 63 - 8 = 55
  });

  test('抛出错误当输入不是有效的三带一组合', () => {
    const cards = [
      { value: '7', suit: 'hearts' },
      { value: '7', suit: 'diamonds' },
      { value: '7', suit: 'spades' },
      { value: '4', suit: 'clubs' },
    ];
    console.log('计算数值：',calculateTripleWithSingleScore(cards));
    expect(() => calculateTripleWithSingleScore(cards));
  });
});

describe.skip('calculateStraightScore', () => {
  test('正确计算顺子的分数', () => {
    const straight = [
      { value: '3', suit: 'hearts' },
      { value: '4', suit: 'diamonds' },
      { value: '5', suit: 'spades' },
      { value: '6', suit: 'clubs' },
      { value: '7', suit: 'hearts' }
    ];
    expect(calculateStraightScore(straight)).toBe(25);
  });

  test('抛出错误当输入不是有效的顺子', () => {
    const notStraight = [
      { value: '3', suit: 'hearts' },
      { value: '4', suit: 'diamonds' },
      { value: '5', suit: 'spades' },
      { value: '7', suit: 'clubs' },
      { value: '8', suit: 'hearts' }
    ];
    expect(() => calculateStraightScore(notStraight)).toThrow('无效的顺子组合');
  });
});

describe.skip('calculatePairScore', () => {
  test('正确计算对子的分数', () => {
    const pair = [
      { value: '7', suit: 'hearts' },
      { value: '7', suit: 'diamonds' }
    ];
    expect(calculatePairScore(pair)).toBe(28); // 7 * 2 * 2 = 28
  });

  test('抛出错误当输入不是有效的对子', () => {
    const notPair = [
      { value: '7', suit: 'hearts' },
      { value: '8', suit: 'diamonds' }
    ];
    expect(() => calculatePairScore(notPair)).toThrow('无效的对子组合');
  });
});

describe.skip('calculateConsecutivePairsScore', () => {
  test('正确计算连对的分数', () => {
    const consecutivePairs = [
      { value: '3', suit: 'hearts' },
      { value: '3', suit: 'diamonds' },
      { value: '4', suit: 'spades' },
      { value: '4', suit: 'clubs' }
    ];
    expect(calculateConsecutivePairsScore(consecutivePairs)).toBe(42); // (3 + 3 + 4 + 4) * 3 = 42
  });

  test('正确计算较长连对的分数', () => {
    const longConsecutivePairs = [
      { value: '3', suit: 'hearts' },
      { value: '3', suit: 'diamonds' },
      { value: '4', suit: 'spades' },
      { value: '4', suit: 'clubs' },
      { value: '5', suit: 'hearts' },
      { value: '5', suit: 'diamonds' }
    ];
    expect(calculateConsecutivePairsScore(longConsecutivePairs)).toBe(48); // (3 + 3 + 4 + 4 + 5 + 5) * 3 = 72
  });

  test('抛出错误当输入不是有效的连对', () => {
    const notConsecutivePairs = [
      { value: '3', suit: 'hearts' },
      { value: '3', suit: 'diamonds' },
      { value: '5', suit: 'spades' },
      { value: '5', suit: 'clubs' }
    ];
    expect(() => calculateConsecutivePairsScore(notConsecutivePairs)).toThrow('无效的连对组合');
  });
});

describe.skip('calculateRocketScore', () => {
  test('正确识别王炸并计算分数', () => {
    const rocket = [
      { value: 'Big', suit: 'joker' },
      { value: 'Small', suit: 'joker' }
    ];
    expect(calculateRocketScore(rocket)).toBe(300);
  });

  test('非王炸组合返回null', () => {
    const notRocket = [
      { value: 'A', suit: 'hearts' },
      { value: 'A', suit: 'spades' }
    ];
    expect(calculateRocketScore(notRocket)).toBeNull();
  });

  test('超过两张牌返回null', () => {
    const tooManyCards = [
      { value: 'Big', suit: 'joker' },
      { value: 'Small', suit: 'joker' },
      { value: 'A', suit: 'hearts' }
    ];
    expect(calculateRocketScore(tooManyCards)).toBeNull();
  });
});

describe.skip('calculateSingleCardScore', () => {
  test('正确计算小于10的牌的分数', () => {
    expect(calculateSingleCardScore({ value: '3' })).toBe(-3);
    expect(calculateSingleCardScore({ value: '7' })).toBe(-7);
    expect(calculateSingleCardScore({ value: '9' })).toBe(-9);
  });

  test('正确计算大于等于10的牌的分数', () => {
    expect(calculateSingleCardScore({ value: '10' })).toBe(10);
    expect(calculateSingleCardScore({ value: 'J' })).toBe(11);
    expect(calculateSingleCardScore({ value: 'Q' })).toBe(12);
    expect(calculateSingleCardScore({ value: 'K' })).toBe(13);
    expect(calculateSingleCardScore({ value: 'A' })).toBe(14);
    expect(calculateSingleCardScore({ value: '2' })).toBe(15);
  });

  test('正确计算大小王的分数', () => {
    expect(calculateSingleCardScore({ value: 'Small' })).toBe(16);
    expect(calculateSingleCardScore({ value: 'Big' })).toBe(17);
  });
});


describe.skip('getBiggestScorecore', () => {

  test('计算牌的最大分值', () => {
    const consecutivePairs = [
      { value: '3', suit: 'hearts' },
      { value: '3', suit: 'diamonds' },
      { value: '4', suit: 'spades' },
      { value: '4', suit: 'clubs' },
      { value: '4', suit: 'clubs' },
      { value: '5', suit: 'clubs' },
      { value: '6', suit: 'clubs' },
      { value: '7', suit: 'clubs' },
      { value: '8', suit: 'clubs' },

    ];
    calculateHighestScore(consecutivePairs);
  });
});

describe('analyzeAndSplitCards', () => {

  test('拆牌', () => {
    const consecutivePairs = [
      { value: '3', suit: 'hearts' },
      { value: '3', suit: 'diamonds' },
      { value: '4', suit: 'spades' },
      { value: '4', suit: 'clubs' },
      { value: '4', suit: 'clubs' },
      { value: '4', suit: 'clubs' },
      { value: '5', suit: 'clubs' },
      { value: '6', suit: 'clubs' },
      { value: '6', suit: 'clubs' },
      { value: '6', suit: 'clubs' },
      { value: '6', suit: 'clubs' },


      { value: '7', suit: 'clubs' },
      { value: '8', suit: 'clubs' },
      { value: '2', suit: 'clubs' },
      { value: 'J', suit: 'clubs' },


    ];
    analyzeAndSplitCards(consecutivePairs);
  });
});

describe.skip('findConsecutiveTriples', () => {
  test('正确找出连续的三根', () => {
    const cards = [
      { value: '3', suit: 'hearts' },
      { value: '3', suit: 'diamonds' },
      { value: '3', suit: 'spades' },
      { value: '4', suit: 'hearts' },
      { value: '4', suit: 'diamonds' },
      { value: '4', suit: 'spades' },
      { value: '5', suit: 'hearts' },
      { value: '5', suit: 'diamonds' },
      { value: '5', suit: 'spades' },
      { value: '7', suit: 'hearts' },
      { value: '7', suit: 'diamonds' },
      { value: '7', suit: 'spades' },
    ];
    const result = findConsecutiveTriples(cards);
    expect(result.length).toBe(1);
    expect(result[0].length).toBe(3);
    expect(result[0].map(triple => triple[0].value)).toEqual(['5', '4', '3']);
  });

  test('当没有连续的三根时返回空数组', () => {
    const cards = [
      { value: '3', suit: 'hearts' },
      { value: '3', suit: 'diamonds' },
      { value: '3', suit: 'spades' },
      { value: '4', suit: 'hearts' },
      { value: '4', suit: 'diamonds' },
      { value: '4', suit: 'spades' },
      { value: '7', suit: 'hearts' },
      { value: '7', suit: 'diamonds' },
      { value: '7', suit: 'spades' },
      { value: '8', suit: 'spades' },
      { value: '8', suit: 'spades' },

    ];
    const result = findConsecutiveTriples(cards);
    expect(result).toEqual([]);
  });
});
