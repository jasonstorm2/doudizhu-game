import {
  analyzeAndSplitCards,
} from '../api/gameApi';
import { describe, test } from '@jest/globals';
import { demonstrateStrategy } from './CardStrategy';





// describe('analyzeAndSplitCards', () => {
//   test('拆牌3', () => {
//     const consecutivePairs = [
//       { value: '3', suit: 'hearts' },
//       { value: '3', suit: 'diamonds' },
//       { value: '4', suit: 'spades' },
//       { value: '4', suit: 'clubs' },
//       { value: '5', suit: 'clubs' },
//       { value: '5', suit: 'clubs' },
//       { value: '5', suit: 'clubs' },

//       { value: '6', suit: 'clubs' },
//       { value: '6', suit: 'clubs' },
//       { value: '6', suit: 'clubs' },


//       { value: '7', suit: 'clubs' },
//       { value: '8', suit: 'clubs' },

//       { value: '10', suit: 'clubs' },
//       { value: '10', suit: 'clubs' },

//       // { value: 'K', suit: 'clubs' },
//       // { value: 'K', suit: 'clubs' },


//       { value: '2', suit: 'clubs' },
//       { value: 'J', suit: 'clubs' },


//     ];
//     analyzeAndSplitCards(consecutivePairs);
//   });


// });


describe('demonstrateStrategy', () => {
  test('游戏', () => {

    // 测试游戏
    const player1Cards = [14, 10, 3];  // 你的牌
    const player2Cards = [11, 5];      // 对手1的牌
    const player3Cards = [13, 8, 6];   // 对手2的牌

    demonstrateStrategy(player1Cards, player2Cards, player3Cards);
  });


});