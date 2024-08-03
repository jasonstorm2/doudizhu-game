<template>
  <div class="player-hand" :class="{ 'current-player': isCurrentPlayer }">
    <h3>{{ isCurrentPlayer ? '当前玩家' : '玩家' }}</h3>
    <div class="cards-container">
      <div 
        v-for="(card, index) in cards" 
        :key="`${card.suit}-${card.value}`"
        class="card" 
        :class="{ 'selected': card.selected }"
        @click="selectCard(index)"
      >
        <span :class="{'red': card.suit === '♥' || card.suit === '♦'}">
          {{ cardDisplay(card) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlayerHand',
  props: {
    cards: {
      type: Array,
      required: true
    },
    isCurrentPlayer: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    selectCard(index) {
      this.$emit('select-card', index);
    },
    cardDisplay(card) {
      if (card.suit === 'Joker') {
        return card.value === 'Small' ? '小王' : '大王';
      }
      return `${card.suit}${card.value}`;
    }
  }
}
</script>

<style scoped>

.player-hand {
  margin: 5px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.current-player {
  background-color: #e6f7ff;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.card {
  width: 30px;  /* 从 40px 减小到 30px */
  height: 45px; /* 从 60px 减小到 45px */
  border: 1px solid #000;
  border-radius: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background-color: white;
  font-size: 12px; /* 添加字体大小设置 */
}

.card.selected {
  background-color: #b3d9ff;
}

.red {
  color: red;
}
</style>