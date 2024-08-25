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
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { canPass, convertCards, isGreaterThanLastPlay, sortCards, validateCardPattern } from '../api/gameApi.js';
import { EventBus } from '../eventBus';
import PlayedCards from './PlayedCards.vue';
import PlayerHand from './PlayerHand.vue';
import StartScreen from './StartScreen.vue';
import VictoryScreen from './VictoryScreen.vue';


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

    const isAIThinking = ref(false);

    const store = useStore();
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
        "content": "这是'跑得快'纸牌游戏的规则和初始设置：\n\n" + JSON.stringify(store.state.gameInfo, null, 2)
      }
    ]);
    const OpenAI = require("openai");

    const client = new OpenAI({
      apiKey: "sk-GZsrnJOEQpwVTs5oFN4kfycrHcSOarBfLJh9IRSwzthEifAx",
      baseURL: "https://api.moonshot.cn/v1",
      dangerouslyAllowBrowser: true  // 添加这一行
    });



    const handleAIPlay = async () => {
      if (isAIThinking.value) {
        console.log("AI正在思考中，请稍候...");
        return;
      }

      try {
        isAIThinking.value = true;
        aiThinking.value = true;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          const gameState = {
            "你目前的手牌": convertCards(players.value[2].cards),
            "上家出牌": convertCards(lastPlayedCards.value),
            "玩家出牌历史": store.state.gameInfo.historyInfo.history
          };

          const newUserMessage = {
            "role": "user",
            "content": `游戏状态：${JSON.stringify(gameState)}。请根据这个状态，决定是出牌还是过牌，如果出牌，选择要出的牌。${retryCount > 0 ? "之前的选择无效，请重新选择。" : ""}`
          };

          const assistantMessage = await getAIReply(newUserMessage);
          const extractedOutput = extractResponseFromAIReply(assistantMessage);

          if (extractedOutput == null || extractedOutput.length === 0) {
            if (!canPass(2)) {
              handlePass(2);
              break;
            }
          } else {
            const formattedOutput = extractedOutput.map(value => ({ value, selected: false }));
            if (validateCardPattern(formattedOutput) && isGreaterThanLastPlay(formattedOutput, lastPlayedCards.value) && validateAIPlay(players.value[2].cards, extractedOutput)) {
              await playAICards(formattedOutput, assistantMessage);
              break;
            }
          }

          retryCount++;
          if (retryCount >= maxRetries) {
            console.error('AI 多次尝试失败，无法正确出牌');
            EventBus.emit('show-alert', 'AI 出牌多次失败，请检查游戏逻辑！');
          }
        }
      } catch (error) {
        console.error('AI play error:', error);
        EventBus.emit('show-alert', 'AI 出牌出错，请重试！');
      } finally {
        isAIThinking.value = false;
        aiThinking.value = false;
      }
    };

    const playAICards = async (formattedOutput, assistantMessage) => {
      conversationHistory.value.push({ "role": "assistant", "content": assistantMessage });
      console.log("ai的策略：", assistantMessage);

      // 确保在这里初始化 selectionCount
      const selectionCount = new Map();

      formattedOutput.forEach(card => {
        selectionCount.set(card.value, (selectionCount.get(card.value) || 0) + 1);
      });


      players.value[2].cards.forEach(card => {
        if (selectionCount.get(card.value) > 0) {
          card.selected = true;
          players.value[2].selectedCards.push(card);
          selectionCount.set(card.value, selectionCount.get(card.value) - 1);
        } else {
          card.selected = false;
        }
      });

      players.value[2].selectedCards = sortCards(players.value[2].selectedCards);
      await store.dispatch('playCards', 2);
      players.value = [...players.value];
    };

    //验证ai是否真的有它出的牌
    function validateAIPlay(aiHand, aiPlay) {
      // 创建一个 Map 来记录 AI 手牌中每种牌的数量
      const handCount = new Map();
      aiHand.forEach(card => {
        handCount.set(card.value, (handCount.get(card.value) || 0) + 1);
      });

      // 检查 AI 选择出的每张牌
      for (const playedCard of aiPlay) {
        if (!handCount.has(playedCard) || handCount.get(playedCard) === 0) {
          // AI 试图出一张它没有的牌
          console.log("ai试图出一张自己手上没有的牌：" + playedCard);
          return false;
        }
        // 减少这张牌的计数
        handCount.set(playedCard, handCount.get(playedCard) - 1);
      }

      // 所有牌都验证通过
      return true;
    }


    function extractResponseFromAIReply(aiReplyText) {
      const startKeyword = "出牌：";
      let startIndex = aiReplyText.indexOf(startKeyword);

      // 如果找不到"出牌："，尝试查找"出牌:"（使用英文冒号）
      if (startIndex === -1) {
        startIndex = aiReplyText.indexOf("出牌:");
      }

      if (startIndex === -1) {
        console.error("未找到'出牌：'关键词");
        return null;
      }

      // 从"出牌："后面开始查找
      const contentStart = startIndex + startKeyword.length;

      // 查找左方括号 [
      const leftBracketIndex = aiReplyText.indexOf("[", contentStart);
      if (leftBracketIndex === -1) {
        console.error("未找到左方括号 [");
        return null;
      }

      // 查找右方括号 ]
      const rightBracketIndex = aiReplyText.indexOf("]", leftBracketIndex);
      if (rightBracketIndex === -1) {
        console.error("未找到右方括号 ]");
        return null;
      }

      // 提取方括号内的内容
      const bracketContent = aiReplyText.substring(leftBracketIndex, rightBracketIndex + 1);

      try {
        // 解析JSON数组
        const output = JSON.parse(bracketContent);
        if (Array.isArray(output)) {
          return output;
        } else {
          console.error("解析结果不是数组");
          return null;
        }
      } catch (error) {
        console.error("解析JSON时出错:", error);
        return null;
      }
    }

    const getAIReply = async (newUserMessage) => {
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          conversationHistory.value.push(newUserMessage);
          console.log("给ai的信息2" + JSON.stringify(conversationHistory.value, null, 2));

          const completion = await client.chat.completions.create({
            model: "moonshot-v1-32k",
            messages: conversationHistory.value,
            temperature: 0.3,
          });

          let content = completion.choices[0].message.content;
          console.log("ai的回答：" + content);
          return content;
        } catch (error) {
          console.error(`AI请求失败（尝试 ${retryCount + 1}/${maxRetries}）:`, error);
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('AI请求多次失败，请稍后再试。');
          }
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    };



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
      isAIThinking,
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