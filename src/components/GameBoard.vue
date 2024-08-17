<template>
  <div class="game-board">

    <audio ref="backgroundMusic" loop>
      <source src="/assets/bgm1.mp3" type="audio/mpeg">
    </audio>
    <start-screen v-if="gameState === 'START'" @start-game="startGame" />
    <template v-else-if="gameState === 'PLAYING'">
      <button @click="toggleMusic">{{ isMusicPlaying ? '关闭音乐' : '开启音乐' }}</button>

      <div class="game-area">
        <div class="players-container">
          <div class="player player-1">
            <player-hand :cards="players[1].cards" :isCurrentPlayer="currentPlayer === 1"
              @select-card="(cardIndex) => handleSelectCard(1, cardIndex)" />
            <button @click="handlePlayCards(1)" :disabled="currentPlayer !== 1">出牌</button>
            <button @click="handlePass(1)" :disabled="currentPlayer !== 1 || !canPass(1)">过牌</button>
          </div>
          <div class="player player-2">
            <player-hand :cards="players[2].cards" :isCurrentPlayer="currentPlayer === 2"
              @select-card="(cardIndex) => handleSelectCard(2, cardIndex)" />
            <button @click="handlePlayCards(2)" :disabled="currentPlayer !== 2">AI 出牌</button>
            <button @click="handlePass(2)" :disabled="currentPlayer !== 2 || !canPass(2)">AI 过牌</button>
          </div>
        </div>

        <div class="played-cards-area">
          <played-cards :cards="playedCards" />
        </div>

        <div class="player player-0">
          <player-hand :cards="players[0].cards" :isCurrentPlayer="currentPlayer === 0"
            @select-card="(cardIndex) => handleSelectCard(0, cardIndex)" />
          <button @click="handlePlayCards(0)" :disabled="currentPlayer !== 0">出牌</button>
          <button @click="handlePass(0)" :disabled="currentPlayer !== 0 || !canPass(0)">过牌</button>
        </div>
      </div>
    </template>
    <victory-screen v-if="gameState === 'END'" :winner="winner" @restart="restartGame" />
  </div>
</template>

<script>
import { useStore } from 'vuex';
import StartScreen from './StartScreen.vue';
import PlayerHand from './PlayerHand.vue';
import PlayedCards from './PlayedCards.vue';
import VictoryScreen from './VictoryScreen.vue';
import { validateCardPattern, isGreaterThanLastPlay, canPass, sortCards, convertCards } from '../api/gameApi.js';
import { EventBus } from '../eventBus';
import { ref, computed, onMounted } from 'vue';


export default {
  name: 'GameBoard',

  components: {
    StartScreen,
    PlayerHand,
    PlayedCards,
    VictoryScreen
  },
  setup() {
    onMounted(() => {
      // 预加载音频
      if (backgroundMusic.value) {
        backgroundMusic.value.load();
      }
    });

    const store = useStore();
    const aiPlayDecision = ref(null);
    const aiThinking = ref(false);

    const isMusicPlaying = ref(false);
    const gameState = computed(() => store.state.gameState);
    const players = computed(() => store.state.players);
    const currentPlayer = computed(() => store.state.currentPlayer);
    let playedCards = computed(() => store.state.playedCards);
    const lastPlayedCards = computed(() => store.state.lastPlayedCards);
    const winner = computed(() => store.state.winner);
    const backgroundMusic = ref(null);
    const stopBackgroundMusic = () => {
      if (backgroundMusic.value) {
        backgroundMusic.value.pause();
        backgroundMusic.value.currentTime = 0;
      }
    };
    const startGame = () => {
      store.dispatch('startGame');
      for (let i = 0; i < 3; i++) {
        store.dispatch('sortPlayerCards', i);
      }
      playBackgroundMusic();
    };
    const toggleMusic = () => {
      if (backgroundMusic.value) {
        if (backgroundMusic.value.paused) {
          backgroundMusic.value.play();
          isMusicPlaying.value = true;
        } else {
          backgroundMusic.value.pause();
          isMusicPlaying.value = false;
        }
      }
    };

    const playBackgroundMusic = () => {
      if (backgroundMusic.value) {
        backgroundMusic.value.play().catch(error => {
          console.error("Error playing audio:", error);
        });
      }
    };

    const restartGame = () => store.dispatch('restartGame');

    const handleSelectCard = (playerIndex, cardIndex) =>
      store.dispatch('selectCard', { playerIndex, cardIndex });

    const handlePlayCards = async (playerIndex) => {
      if (playerIndex === 2) {
        // 如果是 player2，则调用 AI 出牌逻辑
        console.log("ai 开始出牌"); // 输出到 VSCode 控制台

        await handleAIPlay();
      } else {
        // 人类玩家的出牌逻辑保持不变
        let selectedCards = players.value[playerIndex].cards.filter(card => card.selected);
        if (validateCardPattern(selectedCards)) {
          if (!lastPlayedCards.value || isGreaterThanLastPlay(selectedCards, lastPlayedCards.value)) {
            selectedCards = sortCards(selectedCards);
            store.dispatch('playCards', playerIndex);
          } else {
            EventBus.emit('show-alert', '出的牌必须大于上家的牌！');
          }
        } else {
          EventBus.emit('show-alert', '无效的牌型啦！');
        }
      }
    };

    //与ai通信
    const conversationHistory = ref([
      {
        "role": "system",
        "content": "这是'跑得快'纸牌游戏的规则和初始设置：\n\n" +
          JSON.stringify(store.state.gameInfo, null, 2)
      }
    ]);
    const OpenAI = require("openai");


    const handleAIPlay = async () => {
      try {
        aiThinking.value = true;

        const client = new OpenAI({
          apiKey: "sk-GZsrnJOEQpwVTs5oFN4kfycrHcSOarBfLJh9IRSwzthEifAx",
          baseURL: "https://api.moonshot.cn/v1",
          dangerouslyAllowBrowser: true  // 添加这一行
        });

        // 创建新的用户消息
        const newUserMessage = {
          "role": "user",
          "content": `游戏状态：${JSON.stringify({
            playerCards: convertCards(players.value[2].cards),
            lastPlayedCards: convertCards(lastPlayedCards.value),
          })}。请根据这个状态，决定是出牌还是过牌，如果出牌，选择要出的牌。`
        };

        // 将新的用户消息添加到历史记录中
        conversationHistory.value.push(newUserMessage);

        // 携带 messages 与 Kimi 大模型对话
        const completion = await client.chat.completions.create({
          model: "moonshot-v1-8k",
          messages: conversationHistory.value,
          temperature: 0.3,
        });

        // 通过 API 我们获得了 Kimi 大模型给予我们的回复消息（role=assistant）
        const assistantMessage = completion.choices[0].message.content;

        console.log("AI回复的内容2：" + assistantMessage)
        const extractedOutput = extractResponseFromAIReply(assistantMessage);
        console.log("提取数据：" + extractedOutput);



        const reader = completion.body.getReader();
        const decoder = new TextDecoder();
        let aiDecision = '';
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          const parsedLines = lines
            .map(line => line.replace(/^data: /, '').trim())
            .filter(line => line !== '' && line !== '[DONE]')
            .map(line => JSON.parse(line));

          for (const parsedLine of parsedLines) {
            const { choices } = parsedLine;
            const { delta } = choices[0];
            if (delta.content) {
              aiDecision += delta.content;
              // 可以在这里更新UI，显示AI正在思考的过程
              console.log('AI 思考过程:', delta.content); // 输出到 VSCode 控制台
            }
          }
        }
        console.log('AI 最终决策:', aiDecision); // 输出完整的 AI 决策
        // 将 AI 的回复添加到对话历史中
        conversationHistory.value.push({
          "role": "assistant",
          "content": aiDecision
        });

        // 解析AI决策
        const parsedDecision = JSON.parse(aiDecision);
        aiPlayDecision.value = parsedDecision;

        // 根据 AI 的出牌决策，更新玩家2的选择的牌
        players.value[2].cards.forEach(card => {
          card.selected = parsedDecision.selectedCards.some(
            aiCard => aiCard.suit === card.suit && aiCard.value === card.value
          );
        });
        // 执行出牌操作
        if (parsedDecision.action === 'play') {
          store.dispatch('playCards', 2);
        } else if (parsedDecision.action === 'pass') {
          handlePass(2);
        }
      } catch (error) {
        console.error('AI play error:', error);
        EventBus.emit('show-alert', 'AI 出牌出错，请重试！');
      } finally {
        aiThinking.value = false;
      }
    };

    function extractResponseFromAIReply(aiReplyText) {
      // 使用正则表达式查找出牌部分
      const formatMatch = aiReplyText.match(/出牌：\s*(\[.*?\])/);

      if (formatMatch && formatMatch[1]) {
        try {
          // 解析字符串数组
          const outPut = JSON.parse(formatMatch[1]);

          // 确保结果是数组
          if (Array.isArray(outPut)) {
            return outPut;
          } else {
            console.error("提取的内容不是数组");
            return null;
          }
        } catch (error) {
          console.error("解析出牌格式时出错:", error);
          return null;
        }
      } else {
        console.error("未找到有效的出牌格式");
        return null;
      }
    }




    const handlePass = (playerIndex) => {
      if (canPass(players.value[playerIndex].cards, lastPlayedCards.value)) {
        store.dispatch('passPlay', playerIndex);
      } else {
        EventBus.emit('show-alert', '不能过牌！');

      }
    };

    return {
      backgroundMusic,
      isMusicPlaying,
      toggleMusic,
      gameState,
      stopBackgroundMusic,
      players,
      currentPlayer,
      playedCards,
      winner,
      startGame,
      restartGame,
      handleSelectCard,
      handlePlayCards,
      handlePass,
      // 确保返回新添加的方法
      handleAIPlay,
      canPass: (playerIndex) => canPass(players.value[playerIndex].cards, lastPlayedCards.value)
    };
  },
};
</script>

<style scoped>
.game-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100vh;
  padding: 20px;
}

.game-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 80vh;
}

.players-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
}

.player {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-0 {
  margin-top: 20px;
}

.played-cards-area {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100px;
  border: 1px dashed #ccc;
  margin: 20px 0;
}

button {
  margin-top: 10px;
  margin-right: 5px;
}
</style>