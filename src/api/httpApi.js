import axios from 'axios';
import config from '../../config';

const env = process.env.NODE_ENV || 'development';
const BASE_URL = config[env].BASE_URL;

// 发送游戏状态到Flask服务器
export const sendGameStateToFlask = (gameState) => 
  axios.post(`${BASE_URL}/ask_poe`, gameState);
