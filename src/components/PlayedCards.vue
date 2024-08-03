<template>
  <div class="played-cards">
    <div v-for="(card, index) in cards" :key="index" class="card">
      <span :class="{'red': card.suit === '♥' || card.suit === '♦'}">
        {{ cardDisplay(card) }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlayedCards',
  props: {
    cards: {
      type: Array,
      required: true
    }
  },
  methods: {
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
.played-cards {
  display: flex;
  gap: 5px;
}

.card {
  width: 30px;
  height: 45px;
  border: 1px solid #000;
  border-radius: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  font-size: 12px;
}

.red {
  color: red;
}
</style>