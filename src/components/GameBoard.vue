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
      try {
        aiThinking.value = true;
        let canGo = false;
        let isPlay = false;

        let retryCount = 0;
        const maxRetries = 3; // 设置最大重试次数

        while (!canGo && retryCount < maxRetries) {
          // 创建新的用户消息
          const newUserMessage = {
            "role": "user",
            "content": `游戏状态：${JSON.stringify({
              "你目前的手牌": convertCards(players.value[2].cards),
              "上家出牌": convertCards(lastPlayedCards.value),
              "玩家出牌历史": store.state.gameInfo.historyInfo.history
            })}。请根据这个状态，决定是出牌还是过牌，如果出牌，选择要出的牌。${retryCount > 0 ? "之前的选择无效，请重新选择。" : ""}`
          };

          let assistantMessage = aiReplyText(newUserMessage);
          let extractedOutput = extractResponseFromAIReply(assistantMessage);
          console.log("提取AI的发牌：", extractedOutput);

          if (extractedOutput.length === 0) {
            // 判断是否能过牌
            let canP = !canPass(2);
            console.log("是否能过牌:", canP);
            if (canP) {
              canGo = true;
              handlePass(2);
            }
          } else {
            isPlay = true;
            // 判断是否牌型正确
            extractedOutput = extractedOutput.map(value => ({ value, selected: false }));
            console.log("转型后的牌", extractedOutput);
            let validate = validateCardPattern(extractedOutput);
            let isBigger = isGreaterThanLastPlay(extractedOutput, lastPlayedCards.value);
            console.log("上家发的牌", lastPlayedCards.value);
            console.log("牌型是否正确:", validate);
            console.log("是否大于上家:", isBigger);

            if (validate && isBigger) {
              canGo = true;
            } else {
              console.log("牌型不正确请重新出牌");
            }
          }

          if (canGo) {
            // AI 成功出牌的逻辑
            conversationHistory.value.push({
              "role": "assistant",
              "content": assistantMessage
            });

            if (isPlay) {
              const selectionCount = new Map();
              extractedOutput.forEach(aiCard => {
                selectionCount.set(aiCard.value, (selectionCount.get(aiCard.value) || 0) + 1);
              });
              console.log("selectionCount map 内容:", selectionCount);

              players.value[2].cards.forEach(card => {
                if (selectionCount.has(card.value) && selectionCount.get(card.value) > 0) {
                  console.log("选择了：", card.value);
                  card.selected = true;
                  players.value[2].selectedCards.push(card);
                  selectionCount.set(card.value, selectionCount.get(card.value) - 1);
                } else {
                  card.selected = false;
                }
              });
              players.value[2].selectedCards = sortCards(players.value[2].selectedCards);

              // 使用 await 等待 dispatch 完成
              await store.dispatch('playCards', 2);
              // 更新组件状态
              players.value = [...players.value]; // 触发 Vue 的响应式更新
            }

          } else {
            retryCount++;
            if (retryCount >= maxRetries) {
              console.error('AI 多次尝试失败，无法正确出牌');
              EventBus.emit('show-alert', 'AI 出牌多次失败，请检查游戏逻辑！');
              break;
            }
          }
        }

      } catch (error) {
        console.error('AI play error:', error);
        EventBus.emit('show-alert', 'AI 出牌出错，请重试！');
      } finally {
        aiThinking.value = false;
      }
    };


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

    const aiReplyText = async (newUserMessage) => {
      conversationHistory.value.push(newUserMessage);
      console.log("给ai的信息2" + JSON.stringify(conversationHistory.value, null, 2));

      // 携带 messages 与 Kimi 大模型对话
      const completion = await client.chat.completions.create({
        model: "moonshot-v1-8k",
        messages: conversationHistory.value,
        temperature: 0.3,
      });
      // 通过 API 我们获得了 Kimi 大模型给予我们的回复消息（role=assistant）
      return completion.choices[0].message.content;
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