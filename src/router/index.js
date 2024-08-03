import { createRouter, createWebHistory } from 'vue-router'
import StartPage from '../components/StartPage.vue'
import GameBoard from '../components/GameBoard.vue'

const routes = [
  {
    path: '/',
    name: 'Start',
    component: StartPage
  },
  {
    path: '/game',
    name: 'Game',
    component: GameBoard
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router