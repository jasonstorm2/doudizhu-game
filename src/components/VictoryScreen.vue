<template>
    <div class="victory-screen">
      <h2>{{ winner }} 胜利！</h2>
      <button @click="$emit('restart')">重新开始</button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'VictoryScreen',
    props: ['winner']
  }
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