import axios from 'axios';

// const BASE_URL = 'http://192.168.5.255:8080';
// const BASE_URL = 'https://127.0.0.1:8000';
// const BASE_URL = 'https://127.0.0.1:8000';
const BASE_URL = 'http://43.134.78.200:8800';


// 发送游戏状态到Flask服务器
export let sendGameStateToFlask = (gameState) => {
    return axios.post(`${BASE_URL}/ask_poe`, gameState);
  };
  