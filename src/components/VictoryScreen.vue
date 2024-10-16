<template>
  <div class="victory-screen">
    <h2>游戏结束</h2>
    <p>获胜者是: {{ winner }}</p>
    <button @click="restart">重新开始</button>
    <button @click="showPlayHistory">显示出牌记录</button>
  </div>
</template>

<script>
import { gameManager } from '../managers/GameManager';

export default {
  name: 'VictoryScreen',
  props: ['winner'],
  emits: ['restart'],
  setup(props, { emit }) {
    const restart = () => {
      emit('restart');
    };

    const showPlayHistory = () => {
      const moves = gameManager.getPlayerMoves();
      console.log('Complete play history:');
      moves.forEach((move, index) => {
        console.log(`Move ${index + 1}: Player ${move.playerIndex} played ${move.cards.map(card => card.value).join(', ')}`);
      });
    };

    return {
      restart,
      showPlayHistory
    };
  }
};
</script>

<style scoped>
.victory-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}
</style>
