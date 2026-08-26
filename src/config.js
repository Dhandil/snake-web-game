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

    /* 视觉样式（T1 允许的实施者决定项） */
    COLORS: {
      bg: '#101828',
      grid: '#1b2436',
      snakeHead: '#5eead4',
      snakeBody: '#34d399',
      snakeDead: '#64748b',
      food: '#f97316',
      overlayMask: 'rgba(8, 12, 22, 0.72)',
      overlayTitle: '#f8fafc',
      overlayText: '#cbd5e1'
    }
  };
})();
