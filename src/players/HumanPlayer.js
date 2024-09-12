import { Player } from './Player';
import { validateCardPattern, isGreaterThanLastPlay } from '../api/gameApi';
import { EventBus } from '../eventBus';

export class HumanPlayer extends Player {
  constructor(id) {
    super(id, 'HUMAN');
  }

  playCards(lastPlayedCards) {
    if (validateCardPattern(this.selectedCards)) {
      if (!lastPlayedCards || isGreaterThanLastPlay(this.selectedCards, lastPlayedCards)) {
        return this.selectedCards;
      } else {
        EventBus.emit('show-alert', '出的牌必须大于上家的牌！');
      }
    } else {
      EventBus.emit('show-alert', '无效的牌型啦！');
    }
    return null;
  }

  canPass(lastPlayedCards) {
    // 实现人类玩家的过牌逻辑
    return lastPlayedCards && lastPlayedCards.length > 0;
  }
}