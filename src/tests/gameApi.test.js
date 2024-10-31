import { 
  analyzeAndSplitCards,} from '../api/gameApi';
import { describe, test } from '@jest/globals';





describe('analyzeAndSplitCards', () => {
    test('拆牌3', () => {
    const consecutivePairs = [
      { value: '3', suit: 'hearts' },
      { value: '3', suit: 'diamonds' },
      { value: '4', suit: 'spades' },
      { value: '4', suit: 'clubs' },
      { value: '5', suit: 'clubs' },
      { value: '5', suit: 'clubs' },
      { value: '5', suit: 'clubs' },

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