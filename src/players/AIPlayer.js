import { Player } from './Player';
// import { validateCardPattern, isGreaterThanLastPlay, convertCards } from '../api/gameApi';
import { validateCardPattern, isGreaterThanLastPlay } from '../api/gameApi';
import { sendGameStateToFlask } from '../api/httpApi';
import { EventBus } from '../eventBus';

export class AIPlayer extends Player {
  constructor(id) {
    super(id, 'AI');
    this.conversationHistory = [
      {
        "role": "system",
        "content": "这是'跑得快'纸牌游戏的规则和初始设置：\n\n" + JSON.stringify({/* 游戏规则 */}, null, 2)
      }
    ];
  }

  async playCards(lastPlayedCards, gameState) {
    const maxRetries = 5;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const aiDecision = await this.getAIDecision(lastPlayedCards, gameState);
        if (aiDecision === 'pass') {
          return 'pass';
        }
        const formattedOutput = aiDecision.map(value => ({ value, selected: false }));
        if (this.validateAIPlay(formattedOutput, lastPlayedCards)) {
          return formattedOutput;
        }
      } catch (error) {
        console.error('AI play error:', error);
      }
      retryCount++;
    }

    EventBus.emit('show-alert', 'AI 出牌多次失败，请检查游戏逻辑！');
    return null;
  }

  async getAIDecision(lastPlayedCards, gameState) {
    const newUserMessage = {
      "role": "user",
      "content": `游戏状态：${JSON.stringify(gameState)}。请根据这个状态，决定是出牌还是过牌，如果出牌，选择要出的牌。请用一句话回答，不需要多余的分析`
    };

    const rawMessage = await sendGameStateToFlask([...this.conversationHistory, newUserMessage]);
    this.conversationHistory.push(newUserMessage, { "role": "assistant", "content": rawMessage.data });
    return this.extractResponseFromAIReply(rawMessage.data);
  }

  validateAIPlay(formattedOutput, lastPlayedCards) {
    if (validateCardPattern(formattedOutput) && isGreaterThanLastPlay(formattedOutput, lastPlayedCards)) {
      // 检查AI是否真的有这些牌
      const aiCardCounts = new Map();
      this.cards.forEach(card => {
        aiCardCounts.set(card.value, (aiCardCounts.get(card.value) || 0) + 1);
      });

      for (const card of formattedOutput) {
        if (!aiCardCounts.has(card.value) || aiCardCounts.get(card.value) === 0) {
          return false;
        }
        aiCardCounts.set(card.value, aiCardCounts.get(card.value) - 1);
      }
      return true;
    }
    return false;
  }

  extractResponseFromAIReply(aiReplyText) {
    // 实现从AI回复中提取出牌决策的逻辑
    // ...
    console.log(aiReplyText);
  }

}