/* 全局配置常量 —— 数值变更须符合 ENGINEERING_SPEC B-02/B-04 的可测试表述 */
(function () {
  'use strict';
  window.SnakeGame = window.SnakeGame || {};
  window.SnakeGame.config = {
    BOARD_SIZE: 20,            // 棋盘 N×N 格
    INITIAL_INTERVAL_MS: 150,  // 初始步进间隔
    ACCELERATE_EVERY: 5,       // 每吃 5 个食物加速一次
    ACCELERATE_FACTOR: 0.9,    // 间隔 ×0.9（约 -10%）
    MIN_INTERVAL_MS: 60,       // 间隔下限
    SCORE_PER_FOOD: 10,        // 每次进食得分
    INITIAL_SNAKE_LEN: 3,

    /* localStorage 键名（storage.js 使用；snake.muted 消费方为 T4 音效） */
    STORAGE_KEYS: {
      highScore: 'snake.highScore',
      muted: 'snake.muted'
    },

    /* 视觉样式（D8-A 边界三件套调整：底色提亮拉开对比 + 新增描边/警示线/反馈色） */
    COLORS: {
      bg: '#22304f',                              // 棋盘底色（原 #101828，与页面 #0b1120 拉开对比）
      grid: '#2b3a60',
      borderColor: '#4a5d82',                     // 画布描边色（index.html CSS 需保持一致）
      warningRing: 'rgba(248, 113, 113, 0.42)',   // 内沿警示线 = 死亡边界
      headFlash: 'rgba(255, 255, 255, 0.85)',     // B-14 输入即时反馈高亮
      snakeHead: '#5eead4',
      snakeBody: '#34d399',
      snakeDead: '#64748b',
      food: '#f97316',
      overlayMask: 'rgba(8, 12, 22, 0.72)',
      overlayTitle: '#f8fafc',
      overlayText: '#cbd5e1'
    },
    HEAD_FLASH_MS: 120,                           // B-14 高亮渐隐时长
  };
})();
