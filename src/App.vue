<template>
  <div id="app">
    <router-view></router-view>
    <transition name="fade">
      <div v-if="showMessage" class="message-box">
        {{ message }}
      </div>
    </transition>
  </div>
</template>

<script>
import { EventBus } from './eventBus';
export default {
  name: 'App',
  data() {
    return {
      showMessage: false,
      message: ''
    }
  },
  methods: {
    showAlert(msg, duration = 2000) {
      this.message = msg;
      this.showMessage = true;
      setTimeout(() => {
        this.showMessage = false;
      }, duration);
    }
  },
  mounted() {
    EventBus.on('show-alert', this.showAlert)
  },
  beforeUnmount() {
    EventBus.off('show-alert', this.showAlert)
  }
}

</script>

<style>
.message-box {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px 20px;
  border-radius: 5px;
  z-index: 1000;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>